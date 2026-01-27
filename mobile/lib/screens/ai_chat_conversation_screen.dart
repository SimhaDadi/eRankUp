import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'test_engine_screen.dart'; // For MathRichText

class AIChatConversationScreen extends StatefulWidget {
  final String? conversationId;
  final String title;
  final String? questionId;

  const AIChatConversationScreen({
    super.key,
    this.conversationId,
    this.title = 'AI Tutor',
    this.questionId,
  });

  @override
  State<AIChatConversationScreen> createState() => _AIChatConversationScreenState();
}

class _AIChatConversationScreenState extends State<AIChatConversationScreen> {
  final List<Map<String, dynamic>> _messages = [];
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  String? _currentConversationId;

  @override
  void initState() {
    super.initState();
    _currentConversationId = widget.conversationId;
    if (_currentConversationId != null) {
      _fetchMessages();
    } else if (widget.questionId != null) {
      // If triggered from a question, send initial "How can I help with this?" prompt
      _addInitialMessage();
    }
  }

  void _addInitialMessage() {
    setState(() {
      _messages.add({
        'role': 'assistant',
        'content': 'I see you are looking at a specific question. How can I help you understand this better?',
        'createdAt': DateTime.now().toIso8601String(),
      });
    });
  }

  Future<void> _fetchMessages() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.getAIConversationMessages(_currentConversationId!);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List;
        setState(() {
          _messages.clear();
          _messages.addAll(data.cast<Map<String, dynamic>>());
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      setState(() => _isLoading = false);
      debugPrint('Error fetching messages: $e');
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isLoading) return;

    final apiService = Provider.of<ApiService>(context, listen: false);
    _messageController.clear();

    setState(() {
      _messages.add({
        'role': 'user',
        'content': text,
        'createdAt': DateTime.now().toIso8601String(),
      });
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final response = await apiService.sendAIMessage(
        text,
        conversationId: _currentConversationId,
        questionId: widget.questionId,
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentConversationId = data['conversationId'];
        
        setState(() {
          _messages.add({
            'role': 'assistant',
            'content': data['response'],
            'createdAt': DateTime.now().toIso8601String(),
          });
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              _isLoading ? 'AI Tutor is thinking...' : 'Online',
              style: TextStyle(
                fontSize: 10, 
                color: _isLoading ? Colors.orangeAccent : Colors.greenAccent,
                fontWeight: FontWeight.normal
              ),
            ),
          ],
        ),
        elevation: 0,
        actions: [
          if (widget.questionId != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Chip(
                label: const Text('Question Focused', style: TextStyle(fontSize: 10, color: Colors.white)),
                backgroundColor: Colors.blue.shade700,
                visualDensity: VisualDensity.compact,
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty && !_isLoading
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length + (_isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _messages.length) {
                        return _buildTypingIndicator();
                      }
                      return _buildMessageBubble(_messages[index]);
                    },
                  ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.auto_awesome, size: 64, color: Colors.blue.shade200),
          const SizedBox(height: 16),
          Text(
            'How can I help you today?',
            style: AppTextStyles.h3.copyWith(color: Colors.grey.shade400),
          ),
          const SizedBox(height: 8),
          const Text('Ask any doubt, concept, or strategy'),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final bool isUser = message['role'] == 'user';
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!isUser) ...[
                CircleAvatar(
                  radius: 12,
                  backgroundColor: Colors.blue.shade100,
                  child: Icon(Icons.auto_awesome, size: 12, color: Colors.blue.shade700),
                ),
                const SizedBox(width: 8),
              ],
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.75,
                ),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser 
                        ? AppColors.primaryBlue 
                        : (isDark ? const Color(0xFF1E293B) : Colors.white),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isUser ? 20 : 0),
                      bottomRight: Radius.circular(isUser ? 0 : 20),
                    ),
                    boxShadow: isUser || isDark ? [] : [
                      BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: MathRichText(
                    text: message['content'] ?? '',
                    style: TextStyle(
                      color: isUser ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: Text(
              _formatTime(message['createdAt']),
              style: TextStyle(fontSize: 9, color: Colors.grey.shade500),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _messageController,
                  maxLines: 4,
                  minLines: 1,
                  decoration: const InputDecoration(
                    hintText: 'Type your doubt...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    border: InputBorder.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: _sendMessage,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: AppColors.primaryBlue,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('h:mm a').format(date);
    } catch (e) {
      return '';
    }
  }
}
