import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/exam.dart';
import '../theme/app_theme.dart';
import 'exam_detail_screen.dart';

class LiveTestsScreen extends StatefulWidget {
  const LiveTestsScreen({super.key});

  @override
  State<LiveTestsScreen> createState() => _LiveTestsScreenState();
}

class _LiveTestsScreenState extends State<LiveTestsScreen> {
  List<dynamic>? _liveTests;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLiveTests();
  }

  Future<void> _fetchLiveTests() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/exams/live');
      if (response.statusCode == 200) {
        setState(() {
          _liveTests = jsonDecode(response.body) as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching live tests: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Tests & Quizzes'),
        elevation: 0,
      ),
      body: _liveTests == null || _liveTests!.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.live_tv, size: 80, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text(
                    'No live tests available',
                    style: AppTextStyles.h3.copyWith(
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Check back later for live competitions',
                    style: AppTextStyles.body.copyWith(
                      color: isDark ? Colors.white54 : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _liveTests!.length,
              itemBuilder: (context, index) {
                final test = _liveTests![index];
                return _buildLiveTestCard(test);
              },
            ),
    );
  }

  Widget _buildLiveTestCard(Map<String, dynamic> test) {
    final title = test['title'] ?? 'Live Test';
    final description = test['description'] ?? '';
    final startTime = test['startTime'];
    final endTime = test['endTime'];
    final participants = test['participants'] ?? 0;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
            ? [const Color(0xFF1E1B4B), const Color(0xFF312E81)]
            : [const Color(0xFF4F46E5), const Color(0xFF4338CA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withOpacity(0.2) : AppColors.primaryBlue.withOpacity(0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ExamDetailScreen(exam: Exam.fromJson(test)),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildStatusBadge(startTime, endTime),
                    const Spacer(),
                    Icon(Icons.people, size: 16, color: Colors.white.withOpacity(0.8)),
                    const SizedBox(width: 4),
                    Text(
                      '$participants',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withOpacity(0.9),
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: Colors.white.withOpacity(0.8)),
                    const SizedBox(width: 4),
                    Text(
                      _formatTimeRange(startTime, endTime),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    const Spacer(),
                    _buildActionButton(startTime, endTime, isDark),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String? start, String? end) {
    if (start == null || end == null) return const SizedBox.shrink();
    
    final now = DateTime.now();
    final startDate = DateTime.parse(start);
    final endDate = DateTime.parse(end);

    String label = 'LIVE';
    Color bgColor = Colors.white.withOpacity(0.3);

    if (now.isBefore(startDate)) {
      label = 'UPCOMING';
      bgColor = Colors.blue.withOpacity(0.3);
    } else if (now.isAfter(endDate)) {
      label = 'ENDED';
      bgColor = Colors.black.withOpacity(0.3);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label == 'LIVE') ...[
            Icon(Icons.circle, size: 8, color: Colors.white),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String? start, String? end, bool isDark) {
    final now = DateTime.now();
    final startDate = start != null ? DateTime.parse(start) : null;
    final endDate = end != null ? DateTime.parse(end) : null;

    bool isUpcoming = startDate != null && now.isBefore(startDate);
    bool isEnded = endDate != null && now.isAfter(endDate);

    String text = 'Join Now';
    Color textColor = isDark ? const Color(0xFFDC2626) : Colors.red.shade600;
    Color bgColor = Colors.white;

    if (isUpcoming) {
      text = 'Set Reminder';
      textColor = Colors.white;
      bgColor = Colors.blue.withOpacity(0.2);
    } else if (isEnded) {
      text = 'View Results';
      textColor = Colors.white;
      bgColor = Colors.black.withOpacity(0.2);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: (isUpcoming || isEnded) ? Border.all(color: Colors.white.withOpacity(0.3)) : null,
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w900,
          color: textColor,
        ),
      ),
    );
  }

  String _formatTimeRange(String? start, String? end) {
    if (start == null || end == null) return 'Ongoing';
    try {
      final startDate = DateTime.parse(start);
      final endDate = DateTime.parse(end);
      final now = DateTime.now();
      
      if (now.isBefore(startDate)) {
        return 'Starts soon';
      } else if (now.isAfter(endDate)) {
        return 'Ended';
      } else {
        final remaining = endDate.difference(now);
        if (remaining.inHours > 0) {
          return '${remaining.inHours}h ${remaining.inMinutes % 60}m left';
        } else {
          return '${remaining.inMinutes}m left';
        }
      }
    } catch (e) {
      return 'Ongoing';
    }
  }
}
