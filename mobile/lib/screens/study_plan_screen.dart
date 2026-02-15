import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../models/chapter.dart';
import 'test_engine_screen.dart';

class StudyPlanScreen extends StatefulWidget {
  const StudyPlanScreen({super.key});

  @override
  State<StudyPlanScreen> createState() => _StudyPlanScreenState();
}

class _StudyPlanScreenState extends State<StudyPlanScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchPlan();
  }

  Future<void> _fetchPlan() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final apiService = Provider.of<ApiService>(context, listen: false);

    try {
      final response = await apiService.get('/adaptive/learning-path');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _data = jsonDecode(response.body);
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = "Failed to load plan. Take more tests to build your profile.";
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = "An error occurred. Please check your connection.";
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _startTask(String topic) async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);

    try {
      // Fetch questions specifically for this topic
      final response = await apiService.get('/adaptive/learning-path'); // Re-fetching is fine, but ideally we'd have a topic specific start
      // For now, if it's the top topic, we use the pre-fetched questions. 
      // If not, we trigger a generic adaptive session start.
      
      final sessionResponse = await apiService.post('/adaptive/start-session', {
        'topic': topic,
        'limit': 15
      });

      if (sessionResponse.statusCode == 201 || sessionResponse.statusCode == 200) {
        final data = jsonDecode(sessionResponse.body);
        final sessionId = data['sessionId'];
        final questions = data['questions'] as List;
        
        if (mounted) {
          final virtualModel = TestModel(
            id: sessionId,
            title: 'Adaptive Practice: $topic',
            totalQuestions: questions.length,
          );

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => TestEngineScreen(model: virtualModel),
            ),
          ).then((value) => _fetchPlan()); // Refresh on return
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to initialize session')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading && _data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Study Plan')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Study Plan')),
        body: _buildErrorState(),
      );
    }

    final tasks = _data!['tasks'] as List;
    final stats = _data!['stats'];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Daily Study Plan'),
        actions: [
          IconButton(onPressed: _fetchPlan, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildProgressHeader(stats),
            _buildInsightBanner(),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recommended Tasks', style: AppTextStyles.h3),
                      Text('${tasks.length} Total', style: AppTextStyles.caption),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...tasks.map((task) => _buildTaskCard(task)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressHeader(dynamic stats) {
    final theme = Theme.of(context);
    final completed = stats['completedToday'] ?? 0;
    final total = stats['totalTasks'] ?? 5;
    final progress = total > 0 ? (completed / total).toDouble() : 0.0;
    final mastery = stats['overallMastery'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DAILY GOAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.primaryBlue)),
                  const SizedBox(height: 4),
                  Text('$completed of $total Tasks Done', style: AppTextStyles.h2),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: AppColors.primaryBlue.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text('$mastery% Mastery', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlue, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 12,
              backgroundColor: theme.brightness == Brightness.dark ? Colors.white10 : Colors.grey.shade100,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryCyan),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightBanner() {
    final rationale = _data!['rationale'] ?? 'Target your weakest topics for maximum score improvement.';
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF06B6D4)]),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI RECOMMENDATION', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(rationale, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskCard(dynamic task) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final String topic = task['topic'] ?? 'Unknown';
    final String reason = task['reason'] ?? 'Needs practice';
    final String advice = task['advice'] ?? '';
    final bool isCompleted = task['isCompleted'] ?? false;
    final int time = task['estimatedTime'] ?? 30;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isCompleted ? Colors.green.withOpacity(0.5) : (isDark ? const Color(0xFF334155) : Colors.grey.shade100)),
      ),
      child: ExpansionTile(
        shape: const RoundedRectangleBorder(side: BorderSide.none),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: isCompleted ? Colors.green.withOpacity(0.1) : AppColors.primaryBlue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            isCompleted ? Icons.check_circle : Icons.psychology,
            color: isCompleted ? Colors.green : AppColors.primaryBlue,
          ),
        ),
        title: Text(topic, style: AppTextStyles.h4),
        subtitle: Text('$time min • $reason', style: AppTextStyles.caption),
        trailing: const Icon(Icons.keyboard_arrow_down),
        childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        children: [
          const Divider(height: 1),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.lightbulb_outline, size: 16, color: Colors.amber),
              const SizedBox(width: 8),
              const Text('INSIGHT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1, color: Colors.amber)),
            ],
          ),
          const SizedBox(height: 8),
          Text(advice, style: AppTextStyles.bodySmall.copyWith(color: isDark ? Colors.white70 : AppColors.textPrimary)),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () => _startTask(topic),
              style: ElevatedButton.styleFrom(
                backgroundColor: isCompleted ? Colors.green.shade600 : AppColors.primaryBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(isCompleted ? 'PRACTICE AGAIN' : 'START PRACTICE'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.psychology_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 24),
            Text(_error!, textAlign: TextAlign.center, style: AppTextStyles.body),
            const SizedBox(height: 32),
            ElevatedButton(onPressed: _fetchPlan, child: const Text('Retry Analysis')),
          ],
        ),
      ),
    );
  }
}
