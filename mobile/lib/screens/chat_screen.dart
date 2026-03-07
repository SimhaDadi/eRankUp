import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../config/config.dart';
import '../theme/app_theme.dart';
import '../widgets/math_rich_text.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late io.Socket socket;
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  final ScrollController _scrollController = ScrollController();
  String? _myUserId;

  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  void _initSocket() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final token = await apiService.getToken();
    final userId = await apiService.getUserId();

    setState(() {
      _myUserId = userId;
    });

    debugPrint('[ChatScreen] Connecting to socket: ${Config.socketBaseUrl}');
    socket = io.io(Config.socketBaseUrl, io.OptionBuilder()
      .setTransports(['websocket'])
      .setQuery({'token': token})
      .build());

    socket.onConnect((_) {
      debugPrint('[ChatScreen] Connected to chat server');
    });

    socket.onConnectError((err) {
      debugPrint('[ChatScreen] Connection Error: $err');
    });

    socket.onDisconnect((_) {
      debugPrint('[ChatScreen] Disconnected from chat server');
    });

    socket.on('previousMessages', (data) {
      if (mounted) {
        setState(() {
          _messages.clear();
          _messages.addAll(List<Map<String, dynamic>>.from(data));
        });
        _scrollToBottom();
      }
    });

    socket.on('receiveMessage', (data) {
      if (mounted) {
        setState(() {
          _messages.add(data);
        });
        _scrollToBottom();
      }
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() {
    if (_messageController.text.isNotEmpty) {
      socket.emit('sendMessage', {'message': _messageController.text});
      _messageController.clear();
    }
  }

  @override
  void dispose() {
    socket.disconnect();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Support')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                bool isMe = msg['userId'] == _myUserId;
                
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe 
                        ? AppColors.primaryBlue 
                        : (Theme.of(context).brightness == Brightness.dark 
                            ? const Color(0xFF1E293B) 
                            : Colors.grey.shade200),
                      borderRadius: BorderRadius.circular(16).copyWith(
                        bottomRight: isMe ? const Radius.circular(0) : const Radius.circular(16),
                        bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(0),
                      ),
                    ),
                    child: MathRichText(
                      text: msg['message'] ?? '', 
                      style: TextStyle(
                        color: isMe 
                          ? Colors.white 
                          : (Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87)
                      )
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      fillColor: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF1E293B) 
                        : Colors.grey.shade100,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                  style: IconButton.styleFrom(backgroundColor: AppColors.primaryBlue),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
