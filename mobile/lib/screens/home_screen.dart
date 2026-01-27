import 'dart:convert';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import 'exam_detail_screen.dart';
import 'live_tests_screen.dart';
import 'performance_screen.dart';
import 'doubts_screen.dart';
import 'saved_questions_screen.dart';
import 'study_plan_screen.dart';
import '../widgets/daily_goal_widget.dart';
import '../widgets/premium_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late ConfettiController _confettiController;
  Map<String, dynamic>? _stats;
  List<dynamic>? _recentAttempts;
  List<dynamic>? _liveTests;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _fetchHomeData();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  Future<void> _fetchHomeData() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    try {
      // Fetch multiple endpoints in parallel
      final results = await Future.wait([
        apiService.get('/exams/user/stats'),
        apiService.get('/exams/user/recent'),
        apiService.get('/exams/live'),
      ]);

      if (mounted) {
        setState(() {
          if (results[0].statusCode == 200) {
            _stats = jsonDecode(results[0].body);
            if ((_stats?['dailyQuestions'] ?? 0) >= 100) {
              _confettiController.play();
            }
          }
          if (results[1].statusCode == 200) {
            _recentAttempts = jsonDecode(results[1].body) as List;
          }
          if (results[2].statusCode == 200) {
            _liveTests = jsonDecode(results[2].body) as List;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching home data: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: RefreshIndicator(
              onRefresh: _fetchHomeData,
              color: AppColors.primaryBlue,
              child: _isLoading
                  ? _buildLoadingState()
                  : SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeader(),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
                            child: DailyGoalWidget(
                              currentQuestions: _stats?['dailyQuestions'] ?? 0,
                              targetQuestions: 100, // Matching web default
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xxl),
                          _buildQuickStats(),
                           const SizedBox(height: AppSpacing.xxl),
                           _buildAIStudyPlanSection(),
                           const SizedBox(height: AppSpacing.xxl),
                          if (_recentAttempts != null && _recentAttempts!.isNotEmpty)
                            _buildContinueLearning(),
                          if (_liveTests != null && _liveTests!.isNotEmpty) ...[
                            const SizedBox(height: AppSpacing.xxl),
                            _buildLiveTests(),
                          ],
                          const SizedBox(height: AppSpacing.xxl),
                          _buildQuickActions(),
                          const SizedBox(height: AppSpacing.xxl),
                        ],
                      ),
                    ),
            ),
          ),
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              shouldLoop: false,
              colors: const [Colors.green, Colors.blue, Colors.pink, Colors.orange, Colors.purple],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      children: [
        _buildShimmerCard(height: 100),
        const SizedBox(height: AppSpacing.lg),
        _buildShimmerCard(height: 120),
        const SizedBox(height: AppSpacing.lg),
        _buildShimmerCard(height: 150),
      ],
    );
  }

  Widget _buildShimmerCard({required double height}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      ),
    );
  }

  Widget _buildHeader() {
    final hour = DateTime.now().hour;
    String greeting = 'Good Morning';
    String emoji = '🌅';
    
    if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
      emoji = '☀️';
    } else if (hour >= 17) {
      greeting = 'Good Evening';
      emoji = '🌙';
    }

    final streak = _stats?['streak'] ?? 0;

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$greeting $emoji',
            style: AppTextStyles.h3.copyWith(
              color: Theme.of(context).brightness == Brightness.dark 
                  ? Colors.white60 
                  : AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Ready to learn?',
            style: AppTextStyles.h1,
          ),
          if (streak > 0) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: Theme.of(context).brightness == Brightness.dark 
                    ? [const Color(0xFFC2410C), const Color(0xFF991B1B)]
                    : [Colors.orange.shade400, Colors.red.shade400],
                ),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🔥', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 6),
                  Text(
                    '$streak day streak!',
                    style: AppTextStyles.caption.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
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

  Widget _buildQuickStats() {
    final totalTests = _stats?['totalTests'] ?? 0;
    final avgScore = (_stats?['averageScore'] as num?)?.round() ?? 0;
    final bestScore = (_stats?['bestScore'] as num?)?.round() ?? 0;
    final rank = _stats?['rank'] ?? '-';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your Progress', style: AppTextStyles.h2),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.3,
            children: [
              _buildStatCard(
                'Tests Taken',
                totalTests.toString(),
                Icons.quiz,
                AppColors.primaryBlue,
              ),
              _buildStatCard(
                'Avg Score',
                '$avgScore%',
                Icons.trending_up,
                Theme.of(context).brightness == Brightness.dark ? Colors.greenAccent : Colors.green.shade600,
              ),
              _buildStatCard(
                'Best Score',
                '$bestScore%',
                Icons.emoji_events,
                Theme.of(context).brightness == Brightness.dark ? Colors.amberAccent : Colors.amber.shade600,
              ),
              _buildStatCard(
                'Global Rank',
                '#$rank',
                Icons.leaderboard,
                Theme.of(context).brightness == Brightness.dark ? const Color(0xFFA855F7) : Colors.purple.shade600,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      boxShadow: AppShadows.small,
      onTap: () {
          // Navigating to performance from any stat card for a fluid feel
          Navigator.push(context, MaterialPageRoute(builder: (_) => const PerformanceScreen()));
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: AppSpacing.iconXl),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value,
            style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTextStyles.caption.copyWith(
              color: Theme.of(context).brightness == Brightness.dark 
                  ? Colors.white60 
                  : AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildContinueLearning() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lastAttempt = _recentAttempts!.first;
    final model = lastAttempt['model'] as Map<String, dynamic>?;
    final modelTitle = model?['title'] ?? 'Test';
    final score = (lastAttempt['score'] as num?)?.round() ?? 0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Continue Learning', style: AppTextStyles.h2),
          const SizedBox(height: AppSpacing.lg),
          GradientCard(
            gradient: AppColors.heroGradient,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                      child: const Icon(
                        Icons.play_circle_outline,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                      child: Text(
                        'Last Score: $score%',
                        style: AppTextStyles.caption.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  modelTitle,
                  style: AppTextStyles.h3.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Review your performance and improve',
                  style: AppTextStyles.caption.copyWith(
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PerformanceScreen(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      foregroundColor: isDark ? Colors.white : AppColors.primaryBlue,
                      elevation: isDark ? 0 : 2,
                    ),
                    child: const Text('View Performance'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTests() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Live Tests', style: AppTextStyles.h2),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LiveTestsScreen()),
                  );
                },
                child: const Text('View All'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 140,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _liveTests!.take(3).length,
              itemBuilder: (context, index) {
                final test = _liveTests![index];
                return _buildLiveTestCard(test);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTestCard(Map<String, dynamic> test) {
    final title = test['title'] ?? 'Live Test';
    return PremiumCard(
      margin: const EdgeInsets.only(right: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.lg),
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      boxShadow: AppShadows.medium,
      onTap: () {},
      child: Container(
        width: 280,
        decoration: BoxDecoration(
          gradient: AppColors.liveGradient,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.circle, color: Colors.white, size: 8),
                          const SizedBox(width: 4),
                          Text('LIVE', style: AppTextStyles.overline.copyWith(color: Colors.white, fontSize: 10)),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(title, style: AppTextStyles.h4.copyWith(color: Colors.white)),
                const SizedBox(height: 4),
                Text('Join thousands of students', style: AppTextStyles.captionSmall.copyWith(color: Colors.white70)),
              ],
            ),
        )
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: AppTextStyles.h2),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            children: [
              _buildQuickActionCard(
                'Practice',
                Icons.fitness_center,
                Colors.teal,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const StudyPlanScreen()),
                  );
                },
              ),
              _buildQuickActionCard(
                'Doubts',
                Icons.question_answer,
                Colors.indigo,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const DoubtsScreen()),
                  );
                },
              ),
              _buildQuickActionCard(
                'Saved',
                Icons.bookmark,
                Colors.amber,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SavedQuestionsScreen()),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return PremiumCard(
      onTap: onTap,
      color: color.withOpacity(0.1),
      border: Border.all(color: color.withOpacity(0.3)),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: AppSpacing.iconXl),
          const SizedBox(height: AppSpacing.sm),
          Text(
            label,
            style: AppTextStyles.caption.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAIStudyPlanSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Personalized Study Plan', style: AppTextStyles.h2),
              TextButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudyPlanScreen())),
                child: const Text('View Full Plan'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF06B6D4)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: const Color(0xFF4F46E5).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TODAY\'S FOCUS', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(
                            _stats?['topTopicRecommendation'] ?? 'AI is analyzing your performance...',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudyPlanScreen())),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF4F46E5),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Open Daily Plan', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
