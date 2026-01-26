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
  Map<String, dynamic>? _plan;
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
            _plan = jsonDecode(response.body);
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = "Failed to load plan. Please try taking some tests first.";
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching study plan: $e');
      if (mounted) {
        setState(() {
          _error = "An error occurred. Please check your connection.";
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _startPractice() async {
    if (_plan == null) return;

    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);

    try {
      final List<String> questionIds = (_plan!['questions'] as List)
          .map((q) => q['id'] as String)
          .toList();

      final response = await apiService.post('/adaptive/start-session', {
        'questionIds': questionIds,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final sessionId = data['sessionId'];
        
        if (mounted) {
          // Wrap in a virtual TestModel
          final virtualModel = TestModel(
            id: sessionId,
            title: 'Adaptive AI Practice',
            totalQuestions: questionIds.length,
          );

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => TestEngineScreen(model: virtualModel),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error starting adaptive practice: $e');
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
    if (_isLoading && _plan == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Study Plan')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 20),
              Text('Analyzing your mastery...', style: AppTextStyles.h4),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Study Plan')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.psychology_outlined, size: 80, color: Colors.grey),
                const SizedBox(height: 16),
                Text(_error!, textAlign: TextAlign.center, style: AppTextStyles.body),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _fetchPlan,
                  child: const Text('Retry'),
                )
              ],
            ),
          ),
        ),
      );
    }

    final questions = _plan!['questions'] as List;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Personalized Learning Path'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: AppSpacing.xxl),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
              child: Row(
                children: [
                  const Icon(Icons.book_outlined, color: AppColors.textTertiary),
                  const SizedBox(width: 8),
                  Text('Recommended Practice', style: AppTextStyles.h3),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                final q = questions[index];
                return _buildQuestionCard(index + 1, q);
              },
            ),
            const SizedBox(height: 100), // Spacing for bottom button
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(AppSpacing.screenPadding),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: AppShadows.large,
        ),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _startPractice,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryCyan,
              foregroundColor: Colors.white,
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('START ADAPTIVE PRACTICE', style: TextStyle(fontWeight: FontWeight.black)),
                SizedBox(width: 12),
                Icon(Icons.arrow_forward),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(AppSpacing.screenPadding),
      padding: const EdgeInsets.all(AppSpacing.xxl),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        boxShadow: AppShadows.medium,
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: const Icon(Icons.psychology, color: Colors.white),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  'Your AI Insights',
                  style: AppTextStyles.h2,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.bgSecondary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: AppColors.primaryCyan.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.auto_awesome, size: 16, color: AppColors.primaryCyan),
                    SizedBox(width: 8),
                    Text(
                      'RATIONALE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.black,
                        letterSpacing: 1.2,
                        color: AppColors.primaryCyan,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _plan!['rationale'] ?? 'Analyzing your current level...',
                  style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.w500,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSimpleStat('QUESTIONS', _plan!['totalQuestions'].toString(), Icons.target_outlined),
              _buildSimpleStat('TIME', '${(_plan!['totalQuestions'] * 1.5).ceil()}m', Icons.timer_outlined),
              _buildSimpleStat('MODE', 'Adaptive', Icons.bar_chart),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSimpleStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.textTertiary),
        const SizedBox(height: 4),
        Text(value, style: AppTextStyles.h4),
        Text(label, style: AppTextStyles.overline.copyWith(fontSize: 9)),
      ],
    );
  }

  Widget _buildQuestionCard(int index, dynamic q) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.bgSecondary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Center(
              child: Text(
                '$index',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textSecondary),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      q['subject'].toString().toUpperCase(),
                      style: AppTextStyles.overline.copyWith(fontSize: 10, color: AppColors.primaryBlue),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      q['chapter'].toString().toUpperCase(),
                      style: AppTextStyles.overline.copyWith(fontSize: 10),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  q['content'],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
