import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _peerData;
  List<dynamic>? _masteryData;
  List<dynamic>? _matrixData;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final api = Provider.of<ApiService>(context, listen: false);
    try {
      final results = await Future.wait([
        api.get('/analytics/user/peer'),
        api.get('/analytics/mastery'),
        api.get('/analytics/user/matrix'),
      ]);

      if (mounted) {
        setState(() {
          _peerData = jsonDecode(results[0].body);
          _masteryData = jsonDecode(results[1].body);
          _matrixData = jsonDecode(results[2].body);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching analytics: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- Heuristic Study Plan Logic (mirrors web MacroAIInsights) ---
  Map<String, dynamic> _buildPersonalPlan() {
    final accuracy = (_peerData?['avgAccuracy'] as num?)?.toDouble() ?? 0;
    final totalAttempts = (_peerData?['totalAttempts'] as num?)?.toInt() ?? 0;
    final percentile = (_peerData?['percentile'] as num?)?.toInt() ?? 0;

    // Determine profile
    final bool isHighAccuracy = accuracy > 70;
    final bool isImproving = percentile > 50;

    String profileTitle;
    String profileDesc;
    List<Map<String, dynamic>> weeks;

    if (accuracy > 85) {
      profileTitle = 'Elite Performance Mode';
      profileDesc = 'Your accuracy is excellent. Push harder with tougher mocks.';
    } else if (accuracy > 70 && !isImproving) {
      profileTitle = 'Precision Master';
      profileDesc = 'Good accuracy but slowing down. Focus on speed.';
    } else if (accuracy < 60) {
      profileTitle = 'Speed Demon (Risky)';
      profileDesc = 'You rush through questions. Slow down to improve precision.';
    } else {
      profileTitle = 'Foundational Building';
      profileDesc = 'Scores are fluctuating. Topic-wise practice will stabilize them.';
    }

    // Week 1-2
    Map<String, dynamic> week1;
    if (accuracy < 60) {
      week1 = {
        'week': 'Week 1–2',
        'title': 'Concept Reinforcement',
        'color': const Color(0xFF7C3AED),
        'icon': Icons.menu_book_rounded,
        'tasks': [
          'Attempt 1 chapter-wise test daily (25–30 mins)',
          'Review every wrong answer immediately after each test',
          'Read explanations for at least 5 questions per session',
        ],
      };
    } else if (!isHighAccuracy) {
      week1 = {
        'week': 'Week 1–2',
        'title': 'Speed Acceleration',
        'color': const Color(0xFFF59E0B),
        'icon': Icons.timer_rounded,
        'tasks': [
          'Set a timer: max 60 seconds per question in practice',
          'Attempt 2 timed chapter tests daily',
          'Skip and return — don\'t get stuck on hard questions',
        ],
      };
    } else {
      week1 = {
        'week': 'Week 1–2',
        'title': 'Advanced Mock Strategy',
        'color': const Color(0xFF10B981),
        'icon': Icons.emoji_events_rounded,
        'tasks': [
          'Attempt 1 full mock test every 2 days',
          'Target top 10% scorer patterns in the leaderboard',
          'Re-attempt tests where score < 80%',
        ],
      };
    }

    // Week 3
    final week3 = {
      'week': 'Week 3',
      'title': isImproving ? 'Maintain Momentum' : 'Break the Plateau',
      'color': const Color(0xFF3B82F6),
      'icon': Icons.bar_chart_rounded,
      'tasks': isImproving
          ? [
              'Increase test difficulty to previous-year papers',
              'Focus on your weakest subject from the mastery chart',
              'Aim for 5% score improvement over last week',
            ]
          : [
              'Switch to a different subject for 3 days to reset',
              'Do a 10-question daily quiz for confidence building',
              'Review analytics after every 3 tests',
            ],
    };

    // Week 4
    final week4 = {
      'week': 'Week 4',
      'title': 'Peak Performance Prep',
      'color': const Color(0xFFEF4444),
      'icon': Icons.rocket_launch_rounded,
      'tasks': [
        'Attempt 2 full previous-year papers under exam conditions',
        'Review your Top 3 error categories from the Accuracy Matrix',
        'Take a chapter-wise test in your weakest topic every other day',
      ],
    };

    weeks = [week1, week3, week4];

    return {
      'profileTitle': profileTitle,
      'profileDesc': profileDesc,
      'accuracy': accuracy,
      'totalAttempts': totalAttempts,
      'percentile': percentile,
      'weeks': weeks,
    };
  }

  void _showPersonalPlan() {
    final plan = _buildPersonalPlan();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.92,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0A0F24) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              // Drag handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 4),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                  children: [
                    // Header gradient card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                '4-WEEK AI STUDY PLAN',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            plan['profileTitle'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            plan['profileDesc'],
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 18),
                          // Stats row
                          Row(
                            children: [
                              _statChip('${(plan['accuracy'] as double).toStringAsFixed(0)}%', 'Accuracy'),
                              const SizedBox(width: 10),
                              _statChip('${plan['totalAttempts']}', 'Tests Done'),
                              const SizedBox(width: 10),
                              _statChip('${plan['percentile']}%ile', 'Rank'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Week cards
                    ...List.generate((plan['weeks'] as List).length, (i) {
                      final week = (plan['weeks'] as List)[i] as Map<String, dynamic>;
                      return _weekCard(week, isDark);
                    }),

                    const SizedBox(height: 8),

                    // CTA card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFC7D2FE), width: 1.5),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primaryBlue,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.psychology_rounded, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Start Chapter Wise Tests',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                    color: Color(0xFF1E1B4B),
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Quickest path to score improvement',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF6366F1),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF6366F1)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statChip(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.15)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.55),
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _weekCard(Map<String, dynamic> week, bool isDark) {
    final Color color = week['color'] as Color;
    final tasks = week['tasks'] as List<String>;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161F3D) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF2B3A67) : const Color(0xFFE2E8F0),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Week header bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withOpacity(0.75)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            ),
            child: Row(
              children: [
                Icon(week['icon'] as IconData, color: Colors.white, size: 16),
                const SizedBox(width: 8),
                Text(
                  week['week'] as String,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                ),
                const Spacer(),
                Text(
                  week['title'] as String,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          // Tasks
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: tasks
                  .map((task) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.check_circle_rounded,
                                color: Colors.green.shade400, size: 16),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                task,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.white70 : AppColors.textSecondary,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Advanced Analytics'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_peerData != null) _buildPeerRankCard(),
                  const SizedBox(height: AppSpacing.xxl),
                  if (_masteryData != null && _masteryData!.isNotEmpty) _buildRadarChart(),
                  const SizedBox(height: AppSpacing.xxl),
                  if (_matrixData != null && _matrixData!.isNotEmpty) _buildSpeedMatrix(),
                  const SizedBox(height: AppSpacing.xxl),

                  // ── Generate Personal Plan Button ──
                  _buildGeneratePlanButton(),
                  const SizedBox(height: AppSpacing.xxl),
                ],
              ),
            ),
    );
  }

  Widget _buildGeneratePlanButton() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E1B4B), Color(0xFF4338CA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4338CA).withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _showPersonalPlan,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          splashColor: Colors.white.withOpacity(0.1),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Generate Personal Plan',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        '4-week AI study plan based on your data',
                        style: TextStyle(
                          color: Colors.white60,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_rounded, color: Colors.white70, size: 22),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPeerRankCard() {
    final percentile = _peerData!['percentile'] ?? 0;
    final rank = _peerData!['rankPrediction'] ?? 'Analyzing...';
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: AppColors.rankGradient, // Advanced gamified gradient
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
        boxShadow: AppShadows.neonCyan, // Glowing neon shadow
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.public, color: Colors.white70, size: 16),
              const SizedBox(width: 8),
              Text(
                'GLOBAL STANDING', 
                style: AppTextStyles.overline.copyWith(color: Colors.white70, fontWeight: FontWeight.w900, letterSpacing: 2)
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$percentile%ile', 
                      style: const TextStyle(
                        color: Colors.white, 
                        fontSize: 36, 
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1.5,
                        shadows: [Shadow(color: AppColors.primaryCyan, blurRadius: 10)]
                      )
                    ),
                    Text('Better than $percentile% of peers', style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.25), 
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    border: Border.all(color: Colors.white.withOpacity(0.1))
                  ),
                  child: Column(
                    children: [
                      const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('PREDICTED RANK', style: TextStyle(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1), textAlign: TextAlign.center),
                      ),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(rank, style: const TextStyle(color: AppColors.primaryHover, fontWeight: FontWeight.w900, fontSize: 18), textAlign: TextAlign.center),
                      ),
                    ],
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 24),
          // Glowing Neon Bar
          Container(
            height: 12,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              color: Colors.black.withOpacity(0.3),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))]
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: percentile / 100,
                backgroundColor: Colors.transparent,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryCyan),
                minHeight: 12,
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildRadarChart() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isDark ? Colors.white : Colors.black;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Subject Mastery', style: AppTextStyles.h2),
        const SizedBox(height: 8),
        Text('Compare with Topper Average', style: AppTextStyles.caption),
        const SizedBox(height: 24),
        if (_masteryData!.length < 3)
          Container(
            height: 200,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Text(
                'Attempt tests in at least 3 topics to unlock benchmarking.',
                style: TextStyle(color: isDark ? Colors.white60 : Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),
            ),
          )
        else
          SizedBox(
            height: 300,
            child: RadarChart(
            RadarChartData(
              radarShape: RadarShape.polygon,
              ticksTextStyle: const TextStyle(color: Colors.transparent),
              gridBorderData: BorderSide(color: color.withOpacity(0.1)),
              titlePositionPercentageOffset: 0.2,
              titleTextStyle: TextStyle(color: color.withOpacity(0.7), fontSize: 10, fontWeight: FontWeight.bold),
              dataSets: [
                // User (Neon Cyan)
                RadarDataSet(
                  fillColor: AppColors.primaryCyan.withOpacity(0.3),
                  borderColor: AppColors.primaryCyan,
                  entryRadius: 3,
                  dataEntries: _masteryData!.map((e) => RadarEntry(value: (e['yourScore'] as num).toDouble())).toList(),
                  borderWidth: 2.5,
                ),
                // Topper (Cyber Purple)
                RadarDataSet(
                  fillColor: AppColors.primaryPurple.withOpacity(0.1),
                  borderColor: AppColors.primaryPurple,
                  entryRadius: 2,
                  dataEntries: _masteryData!.map((e) => RadarEntry(value: (e['topperScore'] as num).toDouble())).toList(),
                  borderWidth: 1.5,
                ),
              ],
              getTitle: (index, angle) {
                if (index >= _masteryData!.length) return const RadarChartTitle(text: '');
                return RadarChartTitle(text: _masteryData![index]['topic'].toString().substring(0, 3));
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSpeedMatrix() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Speed vs. Accuracy', style: AppTextStyles.h2),
        const SizedBox(height: 8),
        Text('Identify careless mistakes & strong areas', style: AppTextStyles.caption),
        const SizedBox(height: 24),
        SizedBox(
          height: 300,
          child: ScatterChart(
            ScatterChartData(
              scatterSpots: _matrixData!.map((e) {
                final accuracy = (e['accuracy'] as num).toDouble();
                final speed = (e['speed'] as num).toDouble();
                final quadrant = e['quadrant'];
                
                Color color = Colors.grey;
                if (quadrant == 'Mastered') color = Colors.green;
                else if (quadrant == 'Building Strength') color = Colors.blue;
                else if (quadrant == 'Careless/Guessing') color = Colors.red;
                else if (quadrant == 'Needs Focus') color = Colors.orange;

                return ScatterSpot(
                  speed,
                  accuracy,
                  dotPainter: FlDotCirclePainter(color: color, radius: 6),
                );
              }).toList(),
              minX: 0,
              maxX: 120,
              minY: 0,
              maxY: 100,
              gridData: FlGridData(show: true, drawVerticalLine: true, getDrawingHorizontalLine: (_) => FlLine(color: Colors.grey.withOpacity(0.1)), getDrawingVerticalLine: (_) => FlLine(color: Colors.grey.withOpacity(0.1))),
              titlesData: FlTitlesData(
                show: true,
                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (val, meta) => Text(val.toInt().toString(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)))),
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (val, meta) => Text('${val.toInt()}s', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)))),
                rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: true, border: Border.all(color: Colors.grey.withOpacity(0.2))),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
             _legendItem('Mastered', Colors.green),
             _legendItem('Building', Colors.blue),
             _legendItem('Focus', Colors.orange),
             _legendItem('Careless', Colors.red),
          ],
        )
      ],
    );
  }

  Widget _legendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
