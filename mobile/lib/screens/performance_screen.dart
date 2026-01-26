import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';

class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic>? _recentAttempts;
  List<dynamic>? _masteryData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPerformanceData();
  }

  Future<void> _fetchPerformanceData() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final results = await Future.wait([
        apiService.get('/exams/user/stats'),
        apiService.get('/exams/user/recent'),
        apiService.get('/adaptive/mastery'),
      ]);
      
      if (mounted) {
        setState(() {
          _stats = jsonDecode(results[0].body);
          _recentAttempts = jsonDecode(results[1].body) as List;
          if (results[2].statusCode == 200) {
            _masteryData = jsonDecode(results[2].body) as List;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching performance: $e');
      setState(() => _isLoading = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (e) {
      return 'N/A';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final totalTests = _stats?['totalTests'] ?? 0;
    final avgScore = (_stats?['averageScore'] as num?)?.round() ?? 0;
    final bestScore = (_stats?['bestScore'] as num?)?.round() ?? 0;
    final totalTime = _stats?['totalTimeSpent'] ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance Dashboard'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats Cards
            const Text(
              'Your Statistics',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _buildStatCard(
                  'Total Tests',
                  totalTests.toString(),
                  Icons.quiz,
                  Colors.blue,
                ),
                _buildStatCard(
                  'Average Score',
                  '$avgScore%',
                  Icons.trending_up,
                  Colors.green,
                ),
                _buildStatCard(
                  'Best Score',
                  '$bestScore%',
                  Icons.emoji_events,
                  Colors.amber,
                ),
                _buildStatCard(
                  'Time Spent',
                  '${(totalTime / 60).round()}h',
                  Icons.timer,
                  Colors.orange,
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // AI Benchmarking (Radar Chart)
            if (_masteryData != null && _masteryData!.isNotEmpty) ...[
              const Text(
                'AI Benchmarking',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Your mastery vs. Toppers in key topics',
                style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white60 : Colors.grey.shade600),
              ),
              const SizedBox(height: 24),
              _buildRadarChart(),
              const SizedBox(height: 32),
            ],

            // Recent Attempts
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Attempts',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                TextButton(
                  onPressed: () {
                    // Navigate to all attempts
                  },
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            if (_recentAttempts == null || _recentAttempts!.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(Icons.inbox, size: 64, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text(
                        'No attempts yet',
                        style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._recentAttempts!.take(5).map((attempt) => _buildAttemptCard(attempt)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade100),
        boxShadow: isDark ? [] : [
          BoxShadow(
            color: Colors.grey.shade100,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: isDark ? color.withOpacity(0.8) : color, size: 32),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.black,
              color: theme.textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white60 : Colors.grey.shade600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRadarChart() {
    final List<RadarDataSet> dataSets = [
      // Topper Data
      RadarDataSet(
        fillColor: Colors.blue.withOpacity(0.2),
        borderColor: Colors.blue,
        entryRadius: 3,
        dataEntries: _masteryData!.map((m) => RadarEntry(value: (m['topperScore'] as num).toDouble())).toList(),
      ),
      // User Data
      RadarDataSet(
        fillColor: Colors.teal.withOpacity(0.4),
        borderColor: Colors.teal,
        entryRadius: 3,
        dataEntries: _masteryData!.map((m) => RadarEntry(value: (m['yourScore'] as num).toDouble())).toList(),
      ),
    ];

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      height: 300,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade100),
      ),
      child: Column(
        children: [
          Expanded(
            child: RadarChart(
              RadarChartData(
                dataSets: dataSets,
                radarShape: RadarShape.polygon,
                radarBackgroundColor: Colors.transparent,
                borderData: FlBorderData(show: false),
                radarBorderData: const BorderSide(color: Colors.transparent),
                titlePositionPercentageOffset: 0.2,
                titleTextStyle: TextStyle(
                  color: isDark ? Colors.white54 : Colors.black54, 
                  fontSize: 10, 
                  fontWeight: FontWeight.bold
                ),
                getTitle: (index, angle) {
                  final topic = _masteryData![index]['topic'] as String;
                  return RadarChartTitle(text: topic.length > 8 ? '${topic.substring(0, 7)}..' : topic);
                },
                tickCount: 5,
                ticksTextStyle: const TextStyle(color: Colors.transparent),
                gridBorderData: BorderSide(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200, width: 1),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegend('Topper', Colors.blue),
              const SizedBox(width: 20),
              _buildLegend('You', Colors.teal),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegend(String label, Color color) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildAttemptCard(Map<String, dynamic> attempt) {
    final score = (attempt['score'] as num?)?.round() ?? 0;
    final model = attempt['model'] as Map<String, dynamic>?;
    final modelTitle = model?['title'] ?? 'Unknown Test';
    final createdAt = attempt['createdAt'] as String?;
    final correct = attempt['correctAnswers'] ?? 0;
    final total = attempt['totalQuestions'] ?? 0;

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: Theme.of(context).brightness == Brightness.dark 
                  ? [const Color(0xFF1E40AF), const Color(0xFF1E3A8A)]
                  : [Colors.blue.shade400, Colors.blue.shade600],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                '$score%',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.black,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  modelTitle,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: theme.textTheme.bodyLarge?.color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '$correct/$total Correct',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDate(createdAt),
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white38 : Colors.grey.shade400,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: isDark ? Colors.white24 : Colors.grey.shade400),
        ],
      ),
    );
  }
}
