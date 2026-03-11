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
                ],
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
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2) )]
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: percentile / 100,
                backgroundColor: Colors.transparent,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryCyan), // Neon Cyan Progress
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
                  speed, // X-Axis: Time (Lower is better but we plot normally)
                  accuracy, // Y-Axis: Accuracy
                  dotPainter: FlDotCirclePainter(color: color, radius: 6),
                );
              }).toList(),
              minX: 0,
              maxX: 120, // Cap at 2 mins for visual clarity
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
