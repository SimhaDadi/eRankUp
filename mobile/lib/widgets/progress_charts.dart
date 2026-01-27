import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../theme/app_theme.dart';

/// Progress charts for visualizing user performance over time

class ProgressChartWidget extends StatelessWidget {
  final List<AttemptData> attempts;
  final String title;

  const ProgressChartWidget({
    super.key,
    required this.attempts,
    this.title = 'Your Progress',
  });

  @override
  Widget build(BuildContext context) {
    if (attempts.isEmpty) {
      return _buildEmptyState(context);
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
        boxShadow: isDark ? [] : AppShadows.small,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTextStyles.h3.copyWith(color: theme.textTheme.bodyLarge?.color)),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 200,
            child: LineChart(
              _buildLineChartData(context),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _buildLegend(context),
        ],
      ),
    );
  }

  LineChartData _buildLineChartData(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final spots = attempts.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.score.toDouble());
    }).toList();

    return LineChartData(
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        horizontalInterval: 20,
        getDrawingHorizontalLine: (value) {
          return FlLine(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
            strokeWidth: 1,
          );
        },
      ),
      titlesData: FlTitlesData(
        show: true,
        rightTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        topTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 30,
            interval: 1,
            getTitlesWidget: (value, meta) {
              if (value.toInt() >= attempts.length) return const Text('');
              return Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(
                  'T${value.toInt() + 1}',
                  style: AppTextStyles.captionSmall.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              );
            },
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            interval: 20,
            reservedSize: 40,
            getTitlesWidget: (value, meta) {
              return Text(
                '${value.toInt()}%',
                style: AppTextStyles.captionSmall.copyWith(
                  color: AppColors.textTertiary,
                ),
              );
            },
          ),
        ),
      ),
      borderData: FlBorderData(show: false),
      minX: 0,
      maxX: (attempts.length - 1).toDouble(),
      minY: 0,
      maxY: 100,
      lineBarsData: [
        LineChartBarData(
          spots: spots,
          isCurved: true,
          gradient: AppColors.heroGradient,
          barWidth: 3,
          isStrokeCapRound: true,
          dotData: FlDotData(
            show: true,
            getDotPainter: (spot, percent, barData, index) {
              return FlDotCirclePainter(
                radius: 4,
                color: AppColors.primaryBlue,
                strokeWidth: 2,
                strokeColor: isDark ? const Color(0xFF0F172A) : Colors.white,
              );
            },
          ),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              colors: [
                AppColors.primaryBlue.withOpacity(isDark ? 0.4 : 0.3),
                AppColors.primaryBlue.withOpacity(0.0),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
      ],
      lineTouchData: LineTouchData(
        touchTooltipData: LineTouchTooltipData(
          tooltipBgColor: isDark ? const Color(0xFF1E293B) : const Color(0xFF2E353C),
          getTooltipItems: (touchedSpots) {
            return touchedSpots.map((spot) {
              final attempt = attempts[spot.x.toInt()];
              return LineTooltipItem(
                '${spot.y.toInt()}%\n${attempt.examTitle}',
                const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              );
            }).toList();
          },
        ),
      ),
    );
  }

  Widget _buildLegend(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final avgScore = attempts.isEmpty
        ? 0
        : attempts.map((a) => a.score).reduce((a, b) => a + b) ~/
            attempts.length;
    final trend = _calculateTrend();

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildLegendItem(
          'Tests',
          '${attempts.length}',
          Icons.quiz,
          AppColors.primaryBlue,
        ),
        _buildLegendItem(
          'Avg Score',
          '$avgScore%',
          Icons.trending_up,
          isDark ? Colors.greenAccent : Colors.green,
        ),
        _buildLegendItem(
          'Trend',
          trend > 0 ? '+$trend%' : '$trend%',
          trend >= 0 ? Icons.arrow_upward : Icons.arrow_downward,
          trend >= 0 ? (isDark ? Colors.greenAccent : Colors.green) : (isDark ? Colors.redAccent : Colors.red),
        ),
      ],
    );
  }

  Widget _buildLegendItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: AppTextStyles.caption.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: AppTextStyles.captionSmall.copyWith(
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  int _calculateTrend() {
    if (attempts.length < 2) return 0;
    
    final recentCount = (attempts.length / 3).ceil().clamp(2, 5);
    final recent = attempts.sublist(attempts.length - recentCount);
    final earlier = attempts.sublist(0, recentCount);
    
    final recentAvg = recent.map((a) => a.score).reduce((a, b) => a + b) ~/
        recent.length;
    final earlierAvg = earlier.map((a) => a.score).reduce((a, b) => a + b) ~/
        earlier.length;
    
    return recentAvg - earlierAvg;
  }

  Widget _buildEmptyState(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : AppColors.bgTertiary,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      ),
      child: Column(
        children: [
          Icon(
            Icons.show_chart,
            size: 60,
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade400,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No Data Yet',
            style: AppTextStyles.h4.copyWith(
              color: isDark ? Colors.white70 : AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Complete some tests to see your progress',
            style: AppTextStyles.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// Attempt data model for charts
class AttemptData {
  final DateTime date;
  final int score;
  final String examTitle;

  AttemptData({
    required this.date,
    required this.score,
    required this.examTitle,
  });
}

/// Topic-wise performance chart
class TopicPerformanceChart extends StatelessWidget {
  final Map<String, double> topicScores;

  const TopicPerformanceChart({
    super.key,
    required this.topicScores,
  });

  @override
  Widget build(BuildContext context) {
    if (topicScores.isEmpty) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Topic Performance', style: AppTextStyles.h3.copyWith(color: theme.textTheme.bodyLarge?.color)),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 200,
            child: BarChart(
              _buildBarChartData(context),
            ),
          ),
        ],
      ),
    );
  }

  BarChartData _buildBarChartData(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final entries = topicScores.entries.toList();

    return BarChartData(
      alignment: BarChartAlignment.spaceAround,
      maxY: 100,
      barTouchData: BarTouchData(
        touchTooltipData: BarTouchTooltipData(
          tooltipBgColor: isDark ? const Color(0xFF1E293B) : const Color(0xFF2E353C),
          getTooltipItem: (group, groupIndex, rod, rodIndex) {
            return BarTooltipItem(
              '${entries[group.x.toInt()].key}\n${rod.toY.toInt()}%',
              const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            );
          },
        ),
      ),
      titlesData: FlTitlesData(
        show: true,
        rightTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        topTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            getTitlesWidget: (value, meta) {
              if (value.toInt() >= entries.length) return const Text('');
              final topic = entries[value.toInt()].key;
              return Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(
                  topic.length > 8 ? '${topic.substring(0, 8)}...' : topic,
                  style: AppTextStyles.captionSmall.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              );
            },
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 40,
            getTitlesWidget: (value, meta) {
              return Text(
                '${value.toInt()}%',
                style: AppTextStyles.captionSmall.copyWith(
                  color: AppColors.textTertiary,
                ),
              );
            },
          ),
        ),
      ),
      borderData: FlBorderData(show: false),
      barGroups: entries.asMap().entries.map((entry) {
        return BarChartGroupData(
          x: entry.key,
          barRods: [
            BarChartRodData(
              toY: entry.value.value,
              gradient: LinearGradient(
                colors: [
                  AppColors.primaryBlue,
                  AppColors.primaryCyan,
                ],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
              width: 20,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(4),
              ),
            ),
          ],
        );
      }).toList(),
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        horizontalInterval: 20,
        getDrawingHorizontalLine: (value) {
          return FlLine(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
            strokeWidth: 1,
          );
        },
      ),
    );
  }
}
