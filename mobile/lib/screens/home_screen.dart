import 'dart:convert';
import 'package:confetti/confetti.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import 'activity_log_screen.dart';
import 'ai_insights_screen.dart';
import 'analytics_screen.dart';
import 'current_affairs_screen.dart';
import 'doubts_screen.dart';
import 'exam_detail_screen.dart';
import 'live_tests_screen.dart';
import 'leaderboard_screen.dart';
import 'performance_screen.dart';
import 'saved_questions_screen.dart';
import 'study_plan_screen.dart';
import '../widgets/daily_goal_widget.dart';
import '../widgets/premium_card.dart';
import 'practice_mode_screen.dart';

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
              _stats!['dailyQuestionTarget'] = gamiStats['dailyQuestionTarget'];
            }
          }
          
          final target = (_stats?['dailyQuestionTarget'] as num?)?.toInt() ?? 100;
          if (_stats != null && (_stats?['dailyQuestions'] ?? 0) >= target) {
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
      body: _isLoading 
          ? _buildLoadingState() 
          : Stack(
              children: [
                // Main Content
                SafeArea(
                  child: RefreshIndicator(
                    onRefresh: _fetchHomeData,
                    color: Colors.white,
                    backgroundColor: AppColors.primaryBlue,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top Hero Layer
                          Stack(
                            children: [
                              // 1. Hero Background Gradient (Now part of scroll)
                              Container(
                                height: 280,
                                width: double.infinity,
                                decoration: const BoxDecoration(
                                  gradient: AppColors.heroGradient,
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(AppSpacing.radiusXxl),
                                    bottomRight: Radius.circular(AppSpacing.radiusXxl),
                                  ),
                                ),
                              ),
                              // 2. Header and Daily Goal (Layered over background)
                              Column(
                                children: [
                                  _buildHeader(),
                                  const SizedBox(height: AppSpacing.lg),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
                                    child: DailyGoalWidget(
                                      userId: _user?['id'],
                                      currentQuestions: (_stats?['dailyQuestions'] as num?)?.toInt() ?? 0,
                                      targetQuestions: (_stats?['dailyQuestionTarget'] as num?)?.toInt() ?? 100,
                                      goalLabel: _getGoalLabel((_stats?['dailyQuestionTarget'] as num?)?.toInt() ?? 100),
                                      onEditGoal: _showGoalPicker,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: AppSpacing.xxxl + 8),
                          _buildQuickStats(),
                          const SizedBox(height: AppSpacing.xxxl + 12),
                          
                          _buildInSpotlight(),
                          const SizedBox(height: AppSpacing.xxl),

                          _buildResearchInsights(), // Renamed and redesigned from Subject Mastery
                          const SizedBox(height: AppSpacing.xxl),
                          
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
                          const SizedBox(height: AppSpacing.xxxl * 2), // Extra space for bottom nav
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Confetti Layer (Still fixed at top)
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
    String greeting = 'Good Afternoon';
    String emoji = '☀️';
    
    if (hour < 12) {
      greeting = 'Good Morning';
      emoji = '🌅';
    } else if (hour >= 17) {
      greeting = 'Good Evening';
      emoji = '🌙';
    }

    final userName = _user?['fullName']?.split(' ')[0] ?? 'dadi';

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenPadding, 
        AppSpacing.screenPadding * 1.5, 
        AppSpacing.screenPadding, 
        AppSpacing.screenPadding
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting $emoji',
                style: AppTextStyles.caption.copyWith(
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Hey $userName!',
                style: AppTextStyles.h1.copyWith(
                  color: Colors.white,
                  letterSpacing: -0.5,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Conquer SSC & Railway 🎯',
                style: AppTextStyles.h4.copyWith(
                  color: Colors.white.withOpacity(0.9),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.notifications_rounded, color: Colors.white, size: 22),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
                ),
                alignment: Alignment.center,
                child: Text(
                  userName[0].toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.primaryBlue,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInSpotlight() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
          child: Text('In Spotlight', style: AppTextStyles.h2),
        ),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 140,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
            children: [
              _buildSpotlightCard(
                'F&O Bazaar - LIVE YouTube Session',
                'Expirey Strategies | Live OI Analysis • Expert Q&A',
                'expert_avatar_1.png',
                const Color(0xFF1E3A8A), // Deep Blue
                'Every Tuesday - 12:00 PM',
              ),
              _buildSpotlightCard(
                'PICK OF THE WEEK',
                'Top Quantitative shortcuts by Experts for SSC CGL.',
                'expert_avatar_2.png',
                const Color(0xFF4C1D95), // Deep Purple
                'Buy Range: ₹139 - ₹143',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSpotlightCard(String title, String subtitle, String image, Color color, String bottomLabel) {
    return Container(
      width: 320,
      margin: const EdgeInsets.only(right: AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withBlue(color.blue + 30).withRed(color.red + 10)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: 10,
            bottom: 0,
            child: Image.asset(
              'assets/$image', 
              height: 120,
              fit: BoxFit.contain,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.captionSmall.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: 180,
                  child: Text(
                    subtitle,
                    style: AppTextStyles.captionSmall.copyWith(
                      color: Colors.white70,
                      fontSize: 10,
                    ),
                    maxLines: 2,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Icon(Icons.schedule_rounded, size: 10, color: Colors.white.withOpacity(0.6)),
                    const SizedBox(width: 4),
                    Text(
                      bottomLabel,
                      style: AppTextStyles.captionSmall.copyWith(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 9,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Watch in App',
                        style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Fixing the typo from the previous step as well
  Widget _buildQuickStats() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
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
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PerformanceScreen())),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 0),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'VIEW ALL',
                  style: AppTextStyles.captionSmall.copyWith(
                    color: isDark ? theme.colorScheme.primary : AppColors.primaryBlue,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.55, // Ultra-compact
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
    // Rich Institutional Colors (Deep & Saturated)
    final List<Color> gradientColors;
    if (color.value == 0xFF1E40AF) { // Deep Blue
      gradientColors = [const Color(0xFF1E3A8A), const Color(0xFF1E40AF)];
    } else if (color.value == 0xFF10B981) { // Emerald
      gradientColors = [const Color(0xFF065F46), const Color(0xFF059669)];
    } else if (color.value == 0xFFF59E0B) { // Amber
      gradientColors = [const Color(0xFFB45309), const Color(0xFFD97706)];
    } else if (color.value == 0xFF8B5CF6) { // Violet
      gradientColors = [const Color(0xFF5B21B6), const Color(0xFF7C3AED)];
    } else {
      gradientColors = [color.withOpacity(0.9), color];
    }

    return PremiumCard(
      padding: EdgeInsets.zero,
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      onTap: onTap ?? () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const PerformanceScreen()));
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
          border: Border.all(
            color: Colors.white.withOpacity(0.12), // Subtle inner glow
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: gradientColors[0].withOpacity(0.4),
              blurRadius: 18,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -5,
              bottom: -5,
              child: Icon(
                icon,
                size: 60,
                color: Colors.white.withOpacity(0.15),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: Colors.white, size: 14),
                  ),
                  const Spacer(),
                  Text(
                    value,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900, 
                      height: 1.0,
                      color: Colors.white,
                      letterSpacing: -1.0,
                      fontSize: 26,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    label.toUpperCase(),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontWeight: FontWeight.w900,
                      fontSize: 8.5,
                      letterSpacing: 0.8,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
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
                        color: Colors.red.shade600,
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: [
                          BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 4)
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.circle, color: Colors.white, size: 6),
                          const SizedBox(width: 4),
                          Text(
                            'LIVE NOW',
                            style: AppTextStyles.overline.copyWith(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
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

  Widget _buildResearchInsights() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final performance = _stats?['topicPerformance'] as Map<String, dynamic>?;
    if (performance == null || performance.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'RESEARCH INSIGHTS',
                style: AppTextStyles.overline.copyWith(
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  height: 1.2,
                ),
              ),const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.primaryBlue),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 110,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
            itemCount: performance.length,
            itemBuilder: (context, index) {
              final subject = performance.keys.elementAt(index);
              final mastery = (performance[subject] as num?)?.round() ?? 0;
              final colors = [
                AppColors.primaryBlue,
                const Color(0xFF10B981),
                const Color(0xFFF59E0B),
                const Color(0xFF8B5CF6),
              ];
              final color = colors[index % colors.length];

              return Container(
                width: 180,
                margin: const EdgeInsets.only(right: AppSpacing.md),
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  border: Border.all(color: AppColors.divider.withOpacity(0.5)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryBlue.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            subject.toUpperCase(),
                            style: AppTextStyles.captionSmall.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.textSecondary,
                              letterSpacing: 0.5,
                              fontSize: 10,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '$mastery%',
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(100),
                      child: LinearProgressIndicator(
                        value: mastery / 100,
                        backgroundColor: AppColors.divider.withOpacity(0.3),
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                        minHeight: 5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'STABLE GROWTH',
                      style: AppTextStyles.captionSmall.copyWith(
                        fontSize: 8,
                        color: Colors.green.shade600,
                        fontWeight: FontWeight.w800,
                      ),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SERVICES', 
            style: AppTextStyles.overline.copyWith(
              color: isDark ? Colors.white60 : AppColors.textPrimary, 
              fontWeight: FontWeight.w900,
              fontSize: 12,
              letterSpacing: 1.2,
            )
          ),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.sm,
            crossAxisSpacing: AppSpacing.sm,
            childAspectRatio: 2.8,
            children: [
              _buildModernAction(
                'CHAPTER TESTS',
                Icons.account_balance_rounded,
                AppColors.primaryBlue,
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PracticeModeScreen())),
              ),
              _buildModernAction(
                'AI DOUBTS',
                Icons.psychology_rounded,
                const Color(0xFF6366F1),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DoubtsScreen())),
              ),
              _buildModernAction(
                'BOOKMARKS',
                Icons.bookmark_added_rounded,
                const Color(0xFFF59E0B),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SavedQuestionsScreen())),
              ),
              _buildModernAction(
                'CURR. AFFAIRS',
                Icons.newspaper_rounded,
                const Color(0xFF10B981),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CurrentAffairsScreen())),
              ),
              _buildModernAction(
                'ACTIVITY LOG',
                Icons.history_rounded,
                const Color(0xFF0369A1),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ActivityLogScreen())),
              ),
              _buildModernAction(
                'AI INSIGHTS',
                Icons.auto_graph_rounded,
                const Color(0xFF7C3AED),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AIInsightsScreen())),
              ),
              _buildModernAction(
                'LEADERBOARD',
                Icons.leaderboard_rounded,
                const Color(0xFFEAB308),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LeaderboardScreen())),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModernAction(String label, IconData icon, Color color, VoidCallback onTap) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: theme.cardTheme.color ?? Colors.white,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(color: isDark ? const Color(0xFF334155) : AppColors.divider.withOpacity(0.5)),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.captionSmall.copyWith(
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  fontSize: 10,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ],
        ),
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
                    child: ElevatedButton(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudyPlanScreen())),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF4F46E5),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
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
  Future<void> _showGoalPicker() async {
    final currentTarget = (_stats?['dailyQuestionTarget'] as num?)?.toInt() ?? 100;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXl)),
      ),
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Container(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: SingleChildScrollView(
            child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Set Daily Goal', style: AppTextStyles.h2),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'How many questions do you want to practice every day?',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodySmall,
              ),
              const SizedBox(height: AppSpacing.xl),
              Column(
                children: [
                  {'v': 25, 'l': 'Casual', 'd': 'Light preparation'},
                  {'v': 50, 'l': 'Regular', 'd': 'Steady progress'},
                  {'v': 100, 'l': 'Serious', 'd': 'Standard path'},
                  {'v': 200, 'l': 'Intense', 'd': 'Pushing limits'},
                  {'v': 500, 'l': 'Beast Mode', 'd': 'Elite preparation'},
                ].map((item) {
                  final t = item['v'] as int;
                  final label = item['l'] as String;
                  final desc = item['d'] as String;
                  final isSelected = currentTarget == t;
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: InkWell(
                      onTap: () async {
                        Navigator.pop(context);
                        final apiService = Provider.of<ApiService>(context, listen: false);
                        try {
                          await apiService.post('/gamification/daily-target', {'target': t});
                          await _fetchHomeData();
                        } catch (e) {
                          debugPrint('Error updating target: $e');
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.lg),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryBlue.withOpacity(0.1) : Colors.transparent,
                          border: Border.all(
                            color: isSelected ? AppColors.primaryBlue : AppColors.divider,
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: isSelected 
                                  ? AppColors.primaryBlue 
                                  : (isDark ? const Color(0xFF1E293B) : AppColors.cardBackground),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  t.toString(),
                                  style: AppTextStyles.buttonSmall.copyWith(
                                    color: isSelected 
                                      ? Colors.white 
                                      : (isDark ? Colors.white : AppColors.textPrimary),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    label,
                                    style: AppTextStyles.bodyLarge.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: isSelected 
                                        ? AppColors.primaryLight 
                                        : (isDark ? Colors.white : AppColors.textPrimary),
                                    ),
                                  ),
                                  Text(
                                    desc,
                                    style: AppTextStyles.caption.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(Icons.check_circle, color: AppColors.primaryBlue),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.xxl),
            ],
            ),
          ),
        );
      },
    );
  }

  String _getGoalLabel(int target) {
    if (target <= 25) return 'Starter Mode 🐣';
    if (target <= 50) return 'Steady Mode 🐢';
    if (target <= 100) return 'Pro Mode 🎯';
    if (target <= 200) return 'Warrior Mode ⚔️';
    return 'Beast Mode 🦁';
  }
}
