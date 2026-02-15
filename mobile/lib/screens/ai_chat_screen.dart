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

class _AIChatScreenState extends State<AIChatScreen> {
  List<dynamic>? _conversations;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.getAIConversations();
      if (response.statusCode == 200) {
        setState(() {
          _conversations = jsonDecode(response.body) as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching AI conversations: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteConversation(String id) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.deleteAIConversation(id);
      if (response.statusCode == 200) {
        _fetchConversations();
      }
    } catch (e) {
      debugPrint('Error deleting conversation: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Tutor'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _conversations == null || _conversations!.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _fetchConversations,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _conversations!.length,
                    itemBuilder: (context, index) {
                      final convo = _conversations![index];
                      return _buildConversationCard(convo);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const AIChatConversationScreen(),
            ),
          ).then((_) => _fetchConversations());
        },
        icon: const Icon(Icons.add_comment),
        label: const Text('New Chat'),
        backgroundColor: AppColors.primaryBlue,
      ),
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.auto_awesome, size: 64, color: Colors.blue.shade400),
          ),
          const SizedBox(height: 24),
          Text(
            'Meet your Tutor',
            style: AppTextStyles.h2,
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'Get instant help with your doubts, customized to your performance.',
              textAlign: TextAlign.center,
              style: AppTextStyles.body.copyWith(
                color: isDark ? Colors.white60 : AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const AIChatConversationScreen(),
                ),
              ).then((_) => _fetchConversations());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text(
              'Start First Conversation',
              style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationCard(Map<String, dynamic> convo) {
    final title = convo['title'] ?? 'New Thread';
    final updatedAt = convo['updatedAt'];
    final id = convo['id'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
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
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark 
                    ? const Color(0xFF334155) 
                    : Colors.grey.shade200
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.chat_bubble_outline, color: Colors.blue.shade700),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Last updated ${_formatDate(updatedAt)}',
                        style: TextStyle(
                            fontSize: 12, 
                            color: Theme.of(context).brightness == Brightness.dark 
                                ? Colors.white60 
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                  onPressed: () => _confirmDelete(id),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Conversation?'),
        content: const Text('This will permanently remove this chat history.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteConversation(id);
            }, 
            child: const Text('Delete', style: TextStyle(color: Colors.redAccent))
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, h:mm a').format(date);
    } catch (e) {
      return 'N/A';
    }
  }
}
