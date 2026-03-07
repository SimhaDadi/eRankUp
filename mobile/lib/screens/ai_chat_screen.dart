import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'ai_chat_conversation_screen.dart';

class AIChatScreen extends StatefulWidget {
  const AIChatScreen({super.key});

  @override
  State<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends State<AIChatScreen> with SingleTickerProviderStateMixin {
  List<dynamic>? _conversations;
  bool _isLoading = true;
  AnimationController? _pulseController;
  Animation<double>? _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController!, curve: Curves.easeInOut),
    );
    _fetchConversations();
  }

  @override
  void dispose() {
    _pulseController?.dispose();
    super.dispose();
  }

  Future<void> _fetchConversations() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.getAIConversations();
      if (response.statusCode == 200 && mounted) {
        setState(() {
          _conversations = jsonDecode(response.body) as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching AI conversations: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteConversation(String id) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.deleteAIConversation(id);
      if (response.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Conversation deleted'),
            backgroundColor: AppColors.primaryBlue,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        _fetchConversations();
      }
    } catch (e) {
      debugPrint('Error deleting conversation: $e');
    }
  }

  void _startNewChat() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const AIChatConversationScreen()),
    ).then((_) => _fetchConversations());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0F1E) : const Color(0xFFF4F7FF),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                  // Premium AI Hero Banner
                  _buildHeroBanner(isDark),

                  // History Title
                  if (_conversations != null && _conversations!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.xl, AppSpacing.screenPadding, AppSpacing.sm),
                      child: Row(
                        children: [
                          const Icon(Icons.history_rounded, size: 18, color: AppColors.primaryBlue),
                          const SizedBox(width: 8),
                          Text(
                            'Recent Conversations',
                            style: AppTextStyles.h3.copyWith(
                              color: isDark ? Colors.white : AppColors.textPrimary,
                              fontSize: 16,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${_conversations!.length} chats',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white38 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Conversation list or empty state
                  Expanded(
                    child: _conversations == null || _conversations!.isEmpty
                        ? _buildEmptyPrompts(isDark)
                        : RefreshIndicator(
                            onRefresh: _fetchConversations,
                            color: AppColors.primaryBlue,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(
                                AppSpacing.screenPadding,
                                AppSpacing.sm,
                                AppSpacing.screenPadding,
                                100,
                              ),
                              itemCount: _conversations!.length,
                              itemBuilder: (context, index) =>
                                  _buildConversationCard(_conversations![index], isDark),
                            ),
                          ),
                  ),
                ],
              ),
            ),

      // Glowing New Chat FAB
      floatingActionButton: ScaleTransition(
        scale: _pulseAnimation ?? kAlwaysCompleteAnimation,
        child: FloatingActionButton.extended(
          onPressed: _startNewChat,
          elevation: 8,
          backgroundColor: AppColors.primaryBlue,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusPill)),
          icon: const Icon(Icons.add_comment_rounded, color: Colors.white),
          label: const Text(
            'New Chat',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBanner(bool isDark) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1A3A8A), Color(0xFF2456C8), Color(0xFF3A7BD5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppSpacing.radiusXl),
          bottomRight: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.xl, AppSpacing.screenPadding, AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: label + icon
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, color: Colors.white, size: 12),
                    SizedBox(width: 5),
                    Text(
                      'AI POWERED',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Pulsing AI avatar
              ScaleTransition(
                scale: _pulseAnimation ?? kAlwaysCompleteAnimation,
                child: Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.15),
                    border: Border.all(color: Colors.white.withOpacity(0.4), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF00E5FF).withOpacity(0.4),
                        blurRadius: 16,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text('🤖', style: TextStyle(fontSize: 28)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Text(
            'Your AI Tutor',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Ask anything — maths, reasoning, GK, English.\nPersonalised to your weak areas.',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Capability chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _capabilityChip('📐 Math Help'),
              _capabilityChip('📖 Explanation'),
              _capabilityChip('🧠 Mnemonics'),
              _capabilityChip('🎯 Mock Q&A'),
            ],
          ),

          // Start chat button (if no conversations)
          if (_conversations == null || _conversations!.isEmpty) ...[
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _startNewChat,
                icon: const Icon(Icons.play_arrow_rounded),
                label: const Text('Start Your First Chat'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primaryBlue,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.3),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _capabilityChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        border: Border.all(color: Colors.white.withOpacity(0.25)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildEmptyPrompts(bool isDark) {
    final prompts = [
      ('💡', 'Explain the concept of percentage with an example'),
      ('🔢', 'How to solve time and work problems quickly?'),
      ('🗺️', 'Give me 5 important capitals I should memorize'),
      ('✍️', 'How to improve vocabulary for SSC exam?'),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.xl, AppSpacing.screenPadding, 100),
      children: [
        Text(
          'Try asking...',
          style: AppTextStyles.h3.copyWith(
            color: isDark ? Colors.white : AppColors.textPrimary,
            fontSize: 17,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        ...prompts.map((p) => _buildPromptCard(p.$1, p.$2, isDark)),
      ],
    );
  }

  Widget _buildPromptCard(String emoji, String text, bool isDark) {
    return GestureDetector(
      onTap: _startNewChat,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF161F3D) : Colors.white,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: isDark ? AppColors.primaryBlue.withOpacity(0.3) : AppColors.divider,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? AppColors.primaryBlue.withOpacity(0.06)
                  : Colors.grey.withOpacity(0.07),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : AppColors.textPrimary,
                  height: 1.4,
                ),
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded,
                size: 14,
                color: isDark ? Colors.white30 : AppColors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _buildConversationCard(Map<String, dynamic> convo, bool isDark) {
    final title = convo['title'] ?? 'New Thread';
    final updatedAt = convo['updatedAt'] ?? '';
    final id = convo['id'];

    // Pick a gradient per conversation for variety
    final gradients = [
      [const Color(0xFF3366FF), const Color(0xFF00E5FF)],
      [const Color(0xFFA200FF), const Color(0xFF3366FF)],
      [const Color(0xFF00C896), const Color(0xFF3366FF)],
      [const Color(0xFFFF6B00), const Color(0xFFFFB300)],
    ];
    final grad = gradients[(convo.hashCode.abs()) % gradients.length];

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AIChatConversationScreen(
              conversationId: id,
              title: title,
            ),
          ),
        ).then((_) => _fetchConversations());
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF161F3D) : Colors.white,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: isDark
                ? grad[0].withOpacity(0.3)
                : Colors.grey.shade100,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? grad[0].withOpacity(0.08)
                  : Colors.grey.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Gradient avatar
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: grad, begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: const Center(
                child: Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 22),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Last updated ${_formatDate(updatedAt)}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white38 : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            // Delete icon
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 20, color: Colors.redAccent),
              onPressed: () => _confirmDelete(id),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right_rounded,
                size: 20,
                color: isDark ? Colors.white24 : Colors.grey.shade400),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
        title: const Text('Delete Conversation?', style: TextStyle(fontWeight: FontWeight.w800)),
        content: const Text('This will permanently remove this chat history.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteConversation(id);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, h:mm a').format(date);
    } catch (_) {
      return 'recently';
    }
  }
}
