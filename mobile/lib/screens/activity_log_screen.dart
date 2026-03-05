import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'results_screen.dart';
import 'solution_explorer_screen.dart';

class ActivityLogScreen extends StatefulWidget {
  const ActivityLogScreen({super.key});

  @override
  State<ActivityLogScreen> createState() => _ActivityLogScreenState();
}

class _ActivityLogScreenState extends State<ActivityLogScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _activities = [];
  List<Map<String, dynamic>> _filtered = [];
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchActivity();
    _searchController.addListener(_applySearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchActivity() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final res = await api.get('/exams/performance/trend');
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        final formatted = data.map((item) {
          final createdAt = DateTime.tryParse(item['createdAt'] ?? '') ?? DateTime.now();
          return {
            'id': item['id'] ?? '',
            'title': item['exam']?['title'] ?? item['model']?['title'] ?? 'Practice Module',
            'date': _formatDate(createdAt),
            'rawDate': createdAt,
            'score': (item['score'] ?? 0).toDouble(),
            'accuracy': (item['accuracy'] ?? 0).toDouble(),
            'timeTaken': ((item['timeTaken'] ?? 0) / 60).round(),
            'type': item['exam'] != null ? 'Mock Test' : 'Usage',
          };
        }).toList();
        formatted.sort((a, b) => (b['rawDate'] as DateTime).compareTo(a['rawDate'] as DateTime));
        setState(() {
          _activities = List<Map<String, dynamic>>.from(formatted);
          _filtered = _activities;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _applySearch() {
    final q = _searchController.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? _activities
          : _activities.where((a) => (a['title'] as String).toLowerCase().contains(q)).toList();
    });
  }

  String _formatDate(DateTime d) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  Color _scoreColor(double score) {
    if (score >= 80) return const Color(0xFF059669);
    if (score >= 60) return AppColors.primaryBlue;
    return const Color(0xFFEA580C);
  }

  Color _scoreBg(double score) {
    if (score >= 80) return const Color(0xFFDCFCE7);
    if (score >= 60) return const Color(0xFFEFF6FF);
    return const Color(0xFFFFF7ED);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Activity Log'),
        backgroundColor: theme.appBarTheme.backgroundColor,
        foregroundColor: isDark ? Colors.white : AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.divider),
        ),
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            color: theme.cardTheme.color ?? Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search specific test...',
                hintStyle: AppTextStyles.body.copyWith(color: AppColors.textDisabled),
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textTertiary),
                filled: true,
                fillColor: AppColors.bgSecondary,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide: const BorderSide(color: AppColors.divider),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide: const BorderSide(color: AppColors.divider),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
                ),
              ),
            ),
          ),

          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? _buildEmpty()
                    : RefreshIndicator(
                        onRefresh: _fetchActivity,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, idx) => _buildCard(_filtered[idx]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> item) {
    final score = item['score'] as double;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: AppColors.divider),
        boxShadow: AppShadows.small,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Score badge
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: _scoreBg(score),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    border: Border.all(color: _scoreColor(score).withOpacity(0.3)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '${score.round()}%',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: _scoreColor(score),
                        ),
                      ),
                      Text(
                        'Score',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: _scoreColor(score).withOpacity(0.7),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                // Title + meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : AppColors.bgSecondary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              item['type'] as String,
                              style: AppTextStyles.captionSmall.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.calendar_today_rounded, size: 11, color: AppColors.textTertiary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item['date'] as String,
                              style: AppTextStyles.captionSmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['title'] as String,
                        style: AppTextStyles.h4,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.gps_fixed_rounded, size: 13, color: AppColors.textTertiary),
                          const SizedBox(width: 4),
                          Text('${(item['accuracy'] as double).round()}% Accuracy', style: AppTextStyles.captionSmall),
                          const SizedBox(width: 12),
                          Icon(Icons.timer_rounded, size: 13, color: AppColors.textTertiary),
                          const SizedBox(width: 4),
                          Text('${item['timeTaken']} min', style: AppTextStyles.captionSmall),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1, color: AppColors.divider),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(
                      builder: (_) => ResultsScreen(attemptId: item['id'] as String),
                    )),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: BorderSide(color: isDark ? const Color(0xFF334155) : AppColors.divider),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                    ),
                    child: Text('View Analysis', style: AppTextStyles.buttonSmall.copyWith(color: isDark ? Colors.white : AppColors.textPrimary)),
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => SolutionExplorerScreen(attemptId: item['id'] as String),
                  )),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(10),
                    side: const BorderSide(color: AppColors.primaryBlue),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                    backgroundColor: isDark ? AppColors.primaryBlue.withOpacity(0.2) : const Color(0xFFEFF6FF),
                  ),
                  child: const Icon(Icons.arrow_forward_rounded, color: AppColors.primaryBlue, size: 20),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : AppColors.bgSecondary, shape: BoxShape.circle),
            child: const Icon(Icons.history_rounded, size: 40, color: AppColors.textDisabled),
          ),
          const SizedBox(height: 20),
          Text(
            _searchController.text.isEmpty ? 'No activity yet' : 'No results found',
            style: AppTextStyles.h3,
          ),
          const SizedBox(height: 8),
          Text(
            _searchController.text.isEmpty
                ? 'Take a test to see your history here.'
                : 'Try a different search term.',
            style: AppTextStyles.body,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
