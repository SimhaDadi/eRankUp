import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class DoubtsScreen extends StatefulWidget {
  const DoubtsScreen({super.key});

  @override
  State<DoubtsScreen> createState() => _DoubtsScreenState();
}

class _DoubtsScreenState extends State<DoubtsScreen> {
  List<dynamic>? _doubts;
  bool _isLoading = true;
  final TextEditingController _doubtController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchDoubts();
  }

  @override
  void dispose() {
    _doubtController.dispose();
    super.dispose();
  }

  Future<void> _fetchDoubts() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/doubts');
      if (response.statusCode == 200) {
        setState(() {
          _doubts = jsonDecode(response.body) as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching doubts: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _postDoubt() async {
    if (_doubtController.text.trim().isEmpty) return;

    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.post(
        '/doubts',
        {'question': _doubtController.text.trim()},
      );
      
      if (response.statusCode == 201) {
        _doubtController.clear();
        _fetchDoubts(); // Refresh list
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Doubt posted successfully')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error posting doubt: $e');
    }
  }

  void _showAskDoubtDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.help_outline, color: Colors.blue.shade700),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Ask Your Doubt',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _doubtController,
                maxLines: 5,
                decoration: InputDecoration(
                  hintText: 'Describe your doubt in detail...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _postDoubt();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade600,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Post Doubt',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Doubts & Q/A'),
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAskDoubtDialog,
        icon: const Icon(Icons.add),
        label: const Text('Ask Doubt'),
        backgroundColor: AppColors.primaryBlue,
      ),
      body: _doubts == null || _doubts!.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.question_answer, size: 80, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text(
                    'No doubts yet',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Ask your first doubt to get help',
                    style: TextStyle(color: Colors.grey.shade500),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20).copyWith(bottom: 80),
              itemCount: _doubts!.length,
              itemBuilder: (context, index) {
                final doubt = _doubts![index];
                return _buildDoubtCard(doubt);
              },
            ),
    );
  }

  Widget _buildDoubtCard(Map<String, dynamic> doubt) {
    final question = doubt['question'] ?? 'No question';
    final answer = doubt['answer'];
    final status = doubt['status'] ?? 'pending';
    final createdAt = doubt['createdAt'];
    final answeredAt = doubt['answeredAt'];

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: status == 'answered' 
            ? (isDark ? Colors.greenAccent.withOpacity(0.5) : Colors.green.shade200) 
            : (isDark ? const Color(0xFF334155) : Colors.grey.shade200),
          width: status == 'answered' ? 2 : 1,
        ),
        boxShadow: isDark ? [] : [
          BoxShadow(
            color: Colors.grey.shade100,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: status == 'answered' 
                    ? (isDark ? const Color(0xFF064E3B).withOpacity(0.2) : Colors.green.shade50) 
                    : (isDark ? const Color(0xFF78350F).withOpacity(0.2) : Colors.orange.shade50),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      status == 'answered' ? Icons.check_circle : Icons.pending,
                      size: 14,
                      color: status == 'answered' 
                        ? (isDark ? Colors.greenAccent : Colors.green.shade700) 
                        : (isDark ? Colors.orangeAccent : Colors.orange.shade700),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: status == 'answered' 
                          ? (isDark ? Colors.greenAccent : Colors.green.shade700) 
                          : (isDark ? Colors.orangeAccent : Colors.orange.shade700),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (createdAt != null)
                Text(
                  _formatDate(createdAt),
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade500,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Question
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.help_outline, size: 20, color: Colors.blue.shade600),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: TextStyle(
                    fontSize: 14,
                    color: theme.textTheme.bodyLarge?.color,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          
          // Answer (if available)
          if (answer != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A).withOpacity(0.5) : Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? const Color(0xFF064E3B) : Colors.green.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lightbulb, size: 16, color: Colors.green.shade700),
                      const SizedBox(width: 6),
                      Text(
                        'Answer',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                      ),
                      const Spacer(),
                      if (answeredAt != null)
                        Text(
                          _formatDate(answeredAt),
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.green.shade600,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    answer,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white70 : Colors.green.shade900,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
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
