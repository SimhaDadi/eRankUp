import 'dart:convert';
import 'package:confetti/confetti.dart';
import 'package:http/http.dart' as http;
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
import 'practice_mode_screen.dart';
import 'analytics_screen.dart';

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
  bool _revisionAvailable = false;
  String _revisionMessage = '';
  Map<String, dynamic>? _user;

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
    debugPrint('HomeScreen: _fetchHomeData started');
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    try {
      debugPrint('HomeScreen: Fetching data from ${ApiService.baseUrl}');
      // Fetch multiple endpoints in parallel
      final results = await Future.wait([
        apiService.get('/exams/user/stats'),
        apiService.get('/exams/user/recent'),
        apiService.get('/exams/live'),
        apiService.get('/gamification/profile'),
        apiService.get('/ai-study/revision'),
        apiService.getUserProfile(),
      ]).timeout(const Duration(seconds: 10));

      debugPrint('HomeScreen: Data fetched. Statuses: ${results.take(5).map((r) => (r as http.Response).statusCode)}');

      if (mounted) {
        setState(() {
          // stats/exams
          if (results[0] is http.Response && (results[0] as http.Response).statusCode == 200) {
            _stats = jsonDecode((results[0] as http.Response).body);
          } else if (results[0] is http.Response) {
            debugPrint('HomeScreen: Stats failed: ${(results[0] as http.Response).body}');
          }

          // Merge gamification data
          if (results[3] is http.Response && (results[3] as http.Response).statusCode == 200) {
            final gamiStats = jsonDecode((results[3] as http.Response).body);
            if (_stats != null) {
              _stats!['totalXp'] = gamiStats['totalXp'];
              _stats!['level'] = gamiStats['level'];
              _stats!['badges'] = gamiStats['badges'];
              _stats!['currentStreak'] = gamiStats['currentStreak'];
              // also merge topic performance for Subject Mastery
              _stats!['topicPerformance'] = gamiStats['topicPerformance'];
            }
          }
          
          if (_stats != null && (_stats?['dailyQuestions'] ?? 0) >= 100) {
            _confettiController.play();
          }

          // Recent Attempts
          if (results[1] is http.Response && (results[1] as http.Response).statusCode == 200) {
            _recentAttempts = jsonDecode((results[1] as http.Response).body) as List;
          }

          // Live Tests
          if (results[2] is http.Response && (results[2] as http.Response).statusCode == 200) {
            _liveTests = jsonDecode((results[2] as http.Response).body) as List;
          }

          // Revision Data
          if (results.length > 4 && results[4] is http.Response && (results[4] as http.Response).statusCode == 200) {
             final revData = jsonDecode((results[4] as http.Response).body);
             _revisionAvailable = revData['available'] ?? false;
             _revisionMessage = revData['message'] ?? '';
          }

          // User Profile (from cache or API result index 5)
          _user = results[5] as Map<String, dynamic>?;

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
                           
                           _buildSubjectMastery(),
                           const SizedBox(height: AppSpacing.xxl),
                           
                           // Smart Revision Section
                           if (_revisionAvailable) ...[
                             _buildSmartRevisionCard(),
                             const SizedBox(height: AppSpacing.xxl),
                           ],

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
    final userName = _user?['fullName']?.split(' ')[0] ?? 'Aspirant';

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$greeting $emoji',
                    style: AppTextStyles.caption.copyWith(
                      color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.white60 
                          : AppColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Hey $userName!',
                    style: AppTextStyles.h1.copyWith(letterSpacing: -1),
                  ),
                ],
              ),
              Row(
                children: [
                  Stack(
                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.notifications_outlined),
                        color: AppColors.textPrimary,
                      ),
                      Positioned(
                        right: 12,
                        top: 12,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primaryBlue.withOpacity(0.1),
                    child: Text(
                      userName[0],
                      style: TextStyle(
                        color: AppColors.primaryBlue,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Conquer SSC & Railway 🎯',
            style: AppTextStyles.h3.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (streak > 0) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
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
                const SizedBox(width: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF1E293B) 
                        : Colors.white,
                    border: Border.all(color: Colors.amber.shade300, width: 2),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Row(
                    children: [
                      const Text('⭐', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 4),
                      Text(
                        'LVL ${_stats?['level'] ?? 1}',
                        style: AppTextStyles.caption.copyWith(
                          fontWeight: FontWeight.w900,
                          color: Colors.amber.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    final totalTests = _stats?['totalAttempts'] ?? 0;
    final avgScore = (_stats?['averageScore'] as num?)?.round() ?? 0;
    final bestScore = (_stats?['bestScore'] as num?)?.round() ?? 0;
    final rank = _stats?['rank'] ?? '-';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Your Progress', style: AppTextStyles.h2),
              TextButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen())),
                child: const Text('Details'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.4,
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
                const Color(0xFF10B981),
              ),
              _buildStatCard(
                'Best Score',
                '$bestScore%',
                Icons.emoji_events,
                const Color(0xFFF59E0B),
              ),
              _buildStatCard(
                'Global Rank',
                '#$rank',
                Icons.leaderboard,
                const Color(0xFF8B5CF6),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen())),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, {VoidCallback? onTap}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      boxShadow: AppShadows.small,
      onTap: onTap ?? () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const PerformanceScreen()));
      },
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900, height: 1.0),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: AppTextStyles.captionSmall.copyWith(
                    color: isDark ? Colors.white60 : AppColors.textSecondary,
                    fontSize: 10,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
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

  Widget _buildSubjectMastery() {
    final topics = (_stats?['topicPerformance'] as List?) ?? [];
    if (topics.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
          child: Text('Subject Mastery', style: AppTextStyles.h2),
        ),
        const SizedBox(height: AppSpacing.lg),
        SizedBox(
          height: 100,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
            scrollDirection: Axis.horizontal,
            itemCount: topics.length,
            itemBuilder: (context, index) {
              final topic = topics[index];
              final subject = topic['subject'] ?? 'Subject';
              final mastery = (topic['A'] as num?)?.round() ?? 0;
              
              // Define distinct colors for subjects
              final colors = [
                const Color(0xFF3B82F6), // Blue
                const Color(0xFF10B981), // Emerald
                const Color(0xFFF59E0B), // Amber
                const Color(0xFF8B5CF6), // Violet
                const Color(0xFFEC4899), // Pink
              ];
              final color = colors[index % colors.length];

              return Container(
                width: 130,
                margin: const EdgeInsets.only(right: AppSpacing.md),
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  border: Border.all(color: color.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      subject,
                      style: AppTextStyles.caption.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: mastery / 100,
                              backgroundColor: color.withOpacity(0.1),
                              valueColor: AlwaysStoppedAnimation<Color>(color),
                              minHeight: 6,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$mastery%',
                          style: AppTextStyles.captionSmall.copyWith(
                            fontWeight: FontWeight.w900,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
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
                'Chapter Wise Tests',
                Icons.fitness_center,
                Colors.teal,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PracticeModeScreen()),
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
              Expanded(
                child: Text(
                  'Personalized Study Plan', 
                  style: AppTextStyles.h2,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
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
                            _stats?['topTopicRecommendation'] ?? 'Perfecting your SSC & Railway GS strategy...',
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

  Widget _buildSmartRevisionCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)], // Violet to Indigo
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 8),
          ),
        ],
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
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                'Weekly Polish Ready!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _revisionMessage,
            style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Navigate to Revision Test (Placeholder)
                 ScaffoldMessenger.of(context).showSnackBar(
                   const SnackBar(content: Text('Starting Smart Revision Session...')),
                 );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF4F46E5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Start Revision', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
