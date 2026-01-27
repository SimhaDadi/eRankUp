import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/config.dart';
import '../services/api_service.dart';
import '../services/haptic_service.dart';
import '../theme/app_theme.dart';
import '../widgets/math_rich_text.dart';

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
  IO.Socket? _socket;
  bool _isStreaming = false;
  String _streamingText = '';

  @override
  void initState() {
    super.initState();
    _currentConversationId = widget.conversationId;
    if (_currentConversationId != null) {
      _fetchMessages();
    } else if (widget.questionId != null) {
      _addInitialMessage();
    }
    _initSocket();
  }

  void _initSocket() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final token = await apiService.getToken();

    _socket = IO.io('${Config.aiChatSocketUrl}/ai-chat', IO.OptionBuilder()
      .setTransports(['websocket'])
      .setExtraHeaders({'Authorization': 'Bearer $token'})
      .build());

    _socket!.onConnect((_) => debugPrint('[Socket] Connected'));
    _socket!.onDisconnect((_) => debugPrint('[Socket] Disconnected'));

    _socket!.on('streamStart', (data) {
      setState(() {
        _currentConversationId = data['conversationId'];
        _isStreaming = true;
        _streamingText = '';
        _messages.add({
          'role': 'assistant',
          'content': '',
          'createdAt': DateTime.now().toIso8601String(),
        });
      });
      _scrollToBottom();
    });

    _socket!.on('streamChunk', (data) {
      if (mounted) {
        setState(() {
          _streamingText += data['chunk'];
          _messages.last['content'] = _streamingText;
        });
        
        // Throttle haptics to prevent excessive vibration
        _handleStreamingHaptic();
        _scrollToBottom();
      }
    });

    _socket!.on('streamEnd', (data) {
      setState(() {
        _isStreaming = false;
        _messages.last['content'] = data['fullText'];
      });
      _scrollToBottom();
    });

    _socket!.on('error', (data) {
      debugPrint('[Socket] Error: ${data['message']}');
      setState(() => _isStreaming = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Streaming failed. Please try again.'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });
  }

  DateTime? _lastHapticTime;
  void _handleStreamingHaptic() {
    final now = DateTime.now();
    if (_lastHapticTime == null || now.difference(_lastHapticTime!) > const Duration(milliseconds: 100)) {
      HapticService.aiTyping();
      _lastHapticTime = now;
    }
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
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
    final apiService = Provider.of<ApiService>(context, listen: false);
    setState(() => _isLoading = true);
    try {
      final response = await apiService.get('/ai-chat/conversation/$_currentConversationId');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _messages.clear();
          _messages.addAll(data.map((m) => m as Map<String, dynamic>));
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Error fetching messages: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isStreaming) return;

    final apiService = Provider.of<ApiService>(context, listen: false);
    final userId = await apiService.getUserId();
    final profile = await apiService.getUserProfile();
    _messageController.clear();

    setState(() {
      _messages.add({
        'role': 'user',
        'content': text,
        'createdAt': DateTime.now().toIso8601String(),
      });
    });
    _scrollToBottom();

    // Use Socket for streaming
    if (_socket != null && _socket!.connected) {
      _socket!.emit('sendMessage', {
        'userId': userId,
        'role': profile?['role'] ?? 'STUDENT',
        'message': text,
        if (_currentConversationId != null) 'conversationId': _currentConversationId,
        if (widget.questionId != null && _messages.length <= 2) 'questionId': widget.questionId,
      });
    } else {
      // Fallback to REST if socket is down
      try {
        final response = await apiService.post('/ai-chat/message', {
          'message': text,
          if (_currentConversationId != null) 'conversationId': _currentConversationId,
          if (widget.questionId != null && _messages.length <= 2) 'questionId': widget.questionId,
        });

        if (response.statusCode == 201) {
          final data = jsonDecode(response.body);
          setState(() {
            _currentConversationId = data['conversationId'];
            _messages.add({
              'role': 'assistant',
              'content': data['response'],
              'createdAt': DateTime.now().toIso8601String(),
            });
          });
          _scrollToBottom();
        }
      } catch (e) {
        debugPrint('Error sending message: $e');
      }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) => _buildMessageBubble(_messages[index]),
                  ),
          ),
          _buildInputArea(),
        ],
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
                  child: _buildMessageBody(message['content'] ?? '', isUser, isDark),
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

  Widget _buildMessageBody(String content, bool isUser, bool isDark) {
    if (isUser) {
      return MathRichText(
        text: content,
        style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
      );
    }

    // AI Message: Look for SVG and JSON blocks
    final svgRegex = RegExp(r'<svg[\s\S]*?</svg>');
    final quizRegex = RegExp(r'```json\s*(\{[\s\S]*?"interactive_quiz"[\s\S]*?\})\s*```');
    
    final allMatches = <_BlockMatch>[];
    for (final m in svgRegex.allMatches(content)) {
      allMatches.add(_BlockMatch(start: m.start, end: m.end, type: _BlockType.svg, content: m.group(0)!));
    }
    for (final m in quizRegex.allMatches(content)) {
      allMatches.add(_BlockMatch(start: m.start, end: m.end, type: _BlockType.quiz, content: m.group(1)!));
    }
    
    allMatches.sort((a, b) => a.start.compareTo(b.start));

    if (allMatches.isEmpty) {
      return MathRichText(
        text: content,
        style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 14, height: 1.4),
      );
    }

    List<Widget> children = [];
    int lastPos = 0;

    for (final block in allMatches) {
      if (block.start > lastPos) {
        children.add(MathRichText(
          text: content.substring(lastPos, block.start),
          style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 14, height: 1.4),
        ));
      }

      if (block.type == _BlockType.quiz) {
        try {
          final quizData = jsonDecode(block.content)['interactive_quiz'];
          children.add(_InteractiveQuiz(data: quizData));
        } catch (e) {
           children.add(const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('[Note: A practice question failed to load. Please ask the tutor to regenerate it.]', 
              style: TextStyle(color: Colors.redAccent, fontSize: 12, fontStyle: FontStyle.italic)),
          ));
        }
      } else if (block.type == _BlockType.svg) {
        children.add(TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 1200),
          builder: (context, value, child) {
            return Opacity(
              opacity: value,
              child: Transform.translate(
                offset: Offset(0, 30 * (1 - value)),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withOpacity(0.1)),
                  ),
                  child: SvgPicture.string(
                    block.content,
                    placeholderBuilder: (BuildContext context) => const SizedBox(
                      height: 100, 
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2))
                    ),
                  ),
                ),
              ),
            );
          },
        ));
      }

      lastPos = block.end;
    }

    if (lastPos < content.length) {
      children.add(MathRichText(
        text: content.substring(lastPos),
        style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 14, height: 1.4),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
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

  Widget _buildInputArea() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Type your doubt...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  fillColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                  filled: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                maxLines: null,
                keyboardType: TextInputType.multiline,
              ),
            ),
            const SizedBox(width: 8),
            FloatingActionButton(
              onPressed: _sendMessage,
              mini: true,
              elevation: 0,
              backgroundColor: AppColors.primaryBlue,
              child: const Icon(Icons.send, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}

enum _BlockType { quiz, svg }

class _BlockMatch {
  final int start;
  final int end;
  final _BlockType type;
  final String content;

  _BlockMatch({required this.start, required this.end, required this.type, required this.content});
}

class _InteractiveQuiz extends StatefulWidget {
  final Map<String, dynamic> data;
  const _InteractiveQuiz({required this.data});

  @override
  State<_InteractiveQuiz> createState() => _InteractiveQuizState();
}

class _InteractiveQuizState extends State<_InteractiveQuiz> {
  int? _selectedIndex;
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    final options = List<String>.from(widget.data['options']);
    final correctIndex = widget.data['correct_index'] as int;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.black26 : Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.quiz, size: 16, color: AppColors.primaryBlue),
              const SizedBox(width: 8),
              Text('PRACTICE QUIZ', style: AppTextStyles.caption.copyWith(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          MathRichText(
            text: widget.data['question'],
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 16),
          ...List.generate(options.length, (index) {
            Color? bgColor;
            Color? borderColor;
            Widget? icon;

            if (_revealed) {
              if (index == correctIndex) {
                bgColor = Colors.green.withOpacity(0.15);
                borderColor = Colors.green;
                icon = const Icon(Icons.check_circle, size: 16, color: Colors.green);
              } else if (index == _selectedIndex) {
                bgColor = Colors.red.withOpacity(0.15);
                borderColor = Colors.red;
                icon = const Icon(Icons.cancel, size: 16, color: Colors.red);
              }
            } else if (_selectedIndex == index) {
              borderColor = AppColors.primaryBlue;
            }

            return GestureDetector(
              onTap: _revealed ? null : () {
                setState(() => _selectedIndex = index);
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: bgColor ?? (isDark ? Colors.white.withOpacity(0.05) : Colors.white),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor ?? (isDark ? Colors.white10 : Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    Expanded(child: MathRichText(text: options[index], style: const TextStyle(fontSize: 14))),
                    if (icon != null) icon,
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 12),
          if (!_revealed)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedIndex == null ? null : () {
                  setState(() => _revealed = true);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Submit Answer'),
              ),
            ),
          if (_revealed) ...[
            const Divider(height: 24),
            Row(
              children: [
                Icon(
                  _selectedIndex == correctIndex ? Icons.stars : Icons.info_outline,
                  size: 16,
                  color: _selectedIndex == correctIndex ? Colors.orange : Colors.blue,
                ),
                const SizedBox(width: 8),
                Text(
                  _selectedIndex == correctIndex ? 'Excellent!' : 'Learn Why:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _selectedIndex == correctIndex ? Colors.orange : Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            MathRichText(
              text: widget.data['explanation'],
              style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic),
            ),
          ]
        ],
      ),
    );
  }
}
