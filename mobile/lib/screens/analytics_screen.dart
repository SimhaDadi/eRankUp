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
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF1E293B), Color(0xFF0F172A)]),
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppShadows.medium,
      ),
      child: Column(
        children: [
          const Text('GLOBAL STANDING', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$percentile%ile', style: const TextStyle(color: Colors.greenAccent, fontSize: 32, fontWeight: FontWeight.w900)),
                  Text('Better than $percentile% of students', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12)),
                child: Column(
                  children: [
                    const Text('PREDICTED RANK', style: TextStyle(color: Colors.white54, fontSize: 8)),
                    const SizedBox(height: 4),
                    Text(rank, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 20),
          // Simple visual bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentile / 100,
              backgroundColor: Colors.white10,
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.greenAccent),
              minHeight: 8,
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
              titleTextStyle: TextStyle(color: color.withOpacity(0.7), fontSize: 10),
              dataSets: [
                // User
                RadarDataSet(
                  fillColor: AppColors.primaryBlue.withOpacity(0.4),
                  borderColor: AppColors.primaryBlue,
                  entryRadius: 2,
                  dataEntries: _masteryData!.map((e) => RadarEntry(value: (e['yourScore'] as num).toDouble())).toList(),
                  borderWidth: 2,
                ),
                // Topper
                RadarDataSet(
                  fillColor: Colors.transparent,
                  borderColor: Colors.green,
                  entryRadius: 0,
                  dataEntries: _masteryData!.map((e) => RadarEntry(value: (e['topperScore'] as num).toDouble())).toList(),
                  borderWidth: 1,
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
                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (val, meta) => Text(val.toInt().toString(), style: const TextStyle(fontSize: 10)))),
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (val, meta) => Text('${val.toInt()}s', style: const TextStyle(fontSize: 10)))),
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
