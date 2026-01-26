import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class ReportedQuestionsScreen extends StatefulWidget {
  const ReportedQuestionsScreen({super.key});

  @override
  State<ReportedQuestionsScreen> createState() => _ReportedQuestionsScreenState();
}

class _ReportedQuestionsScreenState extends State<ReportedQuestionsScreen> {
  List<dynamic>? _reportedQuestions;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchReportedQuestions();
  }

  Future<void> _fetchReportedQuestions() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/questions/reported');
      if (response.statusCode == 200) {
        setState(() {
          _reportedQuestions = jsonDecode(response.body) as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching reported questions: $e');
      setState(() => _isLoading = false);
    }
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
        title: const Text('Reported Questions'),
        elevation: 0,
      ),
      body: _reportedQuestions == null || _reportedQuestions!.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.flag_outlined, size: 80, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text(
                    'No reported questions',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Report questions with errors to help improve quality',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.grey.shade500),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _reportedQuestions!.length,
              itemBuilder: (context, index) {
                final report = _reportedQuestions![index];
                return _buildReportCard(report);
              },
            ),
    );
  }

  Widget _buildReportCard(Map<String, dynamic> report) {
    final question = report['question'] ?? {};
    final content = question['content'] ?? 'No content';
    final reason = report['reason'] ?? 'No reason provided';
    final status = report['status'] ?? 'pending';
    final createdAt = report['createdAt'];

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
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
          // Status badge
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(isDark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getStatusIcon(status),
                      size: 14,
                      color: isDark ? _getDarkStatusColor(status) : _getStatusColor(status),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isDark ? _getDarkStatusColor(status) : _getStatusColor(status),
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
          
          // Question content
          Text(
            content,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.white70 : Colors.black87,
              height: 1.5,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          
          // Report reason
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF7F1D1D).withOpacity(0.1) : Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? const Color(0xFF991B1B) : Colors.red.shade100),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.report_problem, size: 16, color: isDark ? Colors.redAccent : Colors.red.shade700),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    reason,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.red.shade100 : Colors.red.shade900,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'resolved':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getDarkStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'resolved':
        return Colors.greenAccent;
      case 'pending':
        return Colors.orangeAccent;
      case 'rejected':
        return Colors.redAccent;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'resolved':
        return Icons.check_circle;
      case 'pending':
        return Icons.pending;
      case 'rejected':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inDays == 0) {
        return 'Today';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inDays < 7) {
        return '${diff.inDays} days ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return 'N/A';
    }
  }
}
