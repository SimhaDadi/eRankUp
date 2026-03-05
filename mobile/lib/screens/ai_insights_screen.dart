import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AIInsightsScreen extends StatefulWidget {
  const AIInsightsScreen({super.key});

  @override
  State<AIInsightsScreen> createState() => _AIInsightsScreenState();
}

class _AIInsightsScreenState extends State<AIInsightsScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  Map<String, dynamic>? _report;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchReport();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchReport() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      // GET /analytics/mastery — authenticated, no userId param needed
      final res = await api.get('/analytics/mastery');
      if (res.statusCode == 200) {
        setState(() {
          _report = jsonDecode(res.body);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0C111D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0C111D),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF7C3AED), Color(0xFFDB2777)],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.psychology_rounded, size: 20, color: Colors.white),
            ),
            const SizedBox(width: 12),
            const Text('AI Insights', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
          ],
        ),
        bottom: _report == null
            ? null
            : TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Performance'),
                  Tab(text: 'Recommendations'),
                ],
                indicatorColor: const Color(0xFF22D3EE),
                labelColor: const Color(0xFF22D3EE),
                unselectedLabelColor: Colors.white54,
                labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                indicatorSize: TabBarIndicatorSize.label,
              ),
      ),
      body: _isLoading
          ? _buildLoading()
          : _report == null
              ? _buildEmpty()
              : _buildContent(),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: Color(0xFF22D3EE)),
          const SizedBox(height: 16),
          Text('Analyzing your performance...', style: AppTextStyles.body.copyWith(color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.psychology_outlined, size: 64, color: Color(0xFF475569)),
            const SizedBox(height: 16),
            Text('No Data Available', style: AppTextStyles.h3.copyWith(color: Colors.white70)),
            const SizedBox(height: 8),
            Text('Complete some tests to see AI-powered insights!',
                style: AppTextStyles.body.copyWith(color: Colors.white38), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final r = _report!;
    final totalAttempts = (r['totalAttempts'] ?? 1) as int;
    final totalCorrect = (r['totalCorrect'] ?? 0) as int;
    final overallMastery = (r['overallMastery'] ?? 0).toDouble();
    final accuracy = totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).round() : 0;

    final weakAreas = List<Map<String, dynamic>>.from(r['weakestAreas'] ?? []);
    final strongAreas = List<Map<String, dynamic>>.from(r['strongestAreas'] ?? []);

    return Column(
      children: [
        // Stat cards
        Container(
          color: const Color(0xFF0C111D),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Row(
            children: [
              _statCard('Overall\nMastery', '${overallMastery.round()}%', const Color(0xFF22D3EE), Icons.workspace_premium_rounded),
              const SizedBox(width: 10),
              _statCard('Correct\nAnswers', '$totalCorrect', const Color(0xFF34D399), Icons.check_circle_rounded),
              const SizedBox(width: 10),
              _statCard('Attempts', '$totalAttempts', const Color(0xFFA78BFA), Icons.bolt_rounded),
              const SizedBox(width: 10),
              _statCard('Accuracy', '$accuracy%', const Color(0xFFFBBF24), Icons.trending_up_rounded),
            ],
          ),
        ),
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildOverview(weakAreas, strongAreas),
              _buildRecommendations(weakAreas),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(value,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
            Text(label,
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5),
                maxLines: 2),
          ],
        ),
      ),
    );
  }

  Widget _buildOverview(List<Map<String, dynamic>> weak, List<Map<String, dynamic>> strong) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(Icons.warning_amber_rounded, 'Areas Needing Attention', const Color(0xFFF87171)),
        const SizedBox(height: 12),
        ...weak.map((area) => _weakAreaCard(area)),
        const SizedBox(height: 24),
        _sectionHeader(Icons.emoji_events_rounded, 'Your Strengths', const Color(0xFF34D399)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.6,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: strong.length,
          itemBuilder: (_, i) => _strongAreaCard(strong[i]),
        ),
      ],
    );
  }

  Widget _sectionHeader(IconData icon, String title, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
      ],
    );
  }

  Widget _weakAreaCard(Map<String, dynamic> area) {
    final mastery = (area['masteryScore'] ?? 0).toDouble();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(area['chapterTitle'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(area['subjectTitle'] ?? '', style: const TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 0.5)),
                  ],
                ),
              ),
              Text('${mastery.round()}%',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFFF87171))),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: mastery / 100,
              backgroundColor: const Color(0xFF374151),
              color: const Color(0xFFF87171),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text('${area['totalAttempts'] ?? 0} attempts', style: const TextStyle(color: Colors.white38, fontSize: 11)),
              const SizedBox(width: 12),
              Text('${area['correctAttempts'] ?? 0} correct', style: const TextStyle(color: Colors.white38, fontSize: 11)),
            ],
          ),
          if (area['recommendation'] != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF87171).withOpacity(0.07),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF87171).withOpacity(0.2)),
              ),
              child: Text(area['recommendation'], style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _strongAreaCard(Map<String, dynamic> area) {
    final mastery = (area['masteryScore'] ?? 0).toDouble();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF064E3B), Color(0xFF065F46)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF34D399).withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${mastery.round()}%',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF34D399))),
          const SizedBox(height: 4),
          Text(area['chapterTitle'] ?? '',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
              maxLines: 2, overflow: TextOverflow.ellipsis),
          Text(area['subjectTitle'] ?? '',
              style: const TextStyle(color: Colors.white38, fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _buildRecommendations(List<Map<String, dynamic>> weak) {
    if (weak.isEmpty) {
      return Center(
        child: Text('No recommendations yet. Keep practicing!',
            style: AppTextStyles.body.copyWith(color: Colors.white38)),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: weak.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final area = weak[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2E1065), Color(0xFF4A044E)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFA78BFA).withOpacity(0.3)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFA78BFA).withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text('${i + 1}',
                      style: const TextStyle(color: Color(0xFFA78BFA), fontWeight: FontWeight.w900)),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Focus on ${area['chapterTitle'] ?? ''}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 6),
                    Text(area['recommendation'] ?? '',
                        style: const TextStyle(color: Colors.white60, fontSize: 13, height: 1.4)),
                    const SizedBox(height: 10),
                    Row(
                      children: const [
                        Text('Start Practice',
                            style: TextStyle(color: Color(0xFFA78BFA), fontWeight: FontWeight.w900, fontSize: 12)),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_rounded, color: Color(0xFFA78BFA), size: 14),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
