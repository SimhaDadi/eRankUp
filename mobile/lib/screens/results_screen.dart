import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../widgets/topper_comparison_widget.dart';
import '../theme/app_theme.dart';
import 'solution_explorer_screen.dart';

class ResultsScreen extends StatefulWidget {
  final String attemptId;
  const ResultsScreen({super.key, required this.attemptId});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  Map<String, dynamic>? _results;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchResults();
  }

  Future<void> _fetchResults() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/exams/attempts/${widget.attemptId}');
      if (response.statusCode == 200) {
        setState(() {
          _results = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => _isLoading = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (e) {
      return 'N/A';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_results == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Test Results')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text('Results Not Found', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('We couldn\'t load the results for this test.'),
            ],
          ),
        ),
      );
    }

    final model = _results?['model'] as Map<String, dynamic>?;
    final exams = model?['exams'] as List?;
    final examTitle = exams?.isNotEmpty == true ? exams![0]['title'] : 'Test';
    final modelTitle = model?['title'] ?? 'Unknown Test';
    final createdAt = _results?['createdAt'] as String?;
    
    final insights = _results?['insights'];
    final score = (_results?['score'] as num?)?.round() ?? 0;
    final totalQ = _results?['totalQuestions'] as int? ?? 0;
    final correct = _results?['correctAnswers'] as int? ?? 0;
    final incorrect = totalQ - correct;
    final timeTaken = _results?['timeTaken'] as int? ?? 0; // seconds
    final accuracy = totalQ > 0 ? ((correct / totalQ) * 100).round() : 0;
    
    final strengths = (insights?['strengths'] as List?)?.map((e) => e.toString()).toList() ?? [];
    final topicAnalysis = insights?['topicAnalysis'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Test Results'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with exam info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        examTitle,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: theme.textTheme.bodyLarge?.color,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        modelTitle,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.white60 : Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'COMPLETED ON',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade400,
                        letterSpacing: 1,
                      ),
                    ),
                    Text(
                      _formatDate(createdAt),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: theme.textTheme.bodyLarge?.color,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Hero Score Card
            Container(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
                boxShadow: [
                    BoxShadow(color: AppColors.primaryBlue.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))
                ]
              ),
              child: Column(
                children: [
                  Text('OVERALL SCORE', style: AppTextStyles.whiteSubtitleWithShadow.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                  )),
                  const SizedBox(height: 8),
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: score.toDouble()),
                    duration: const Duration(seconds: 2),
                    curve: Curves.easeOutQuart,
                    builder: (context, value, child) {
                      return Text(
                        '${value.round()}%',
                        style: AppTextStyles.whiteWithShadow.copyWith(
                          fontSize: 64,
                          fontWeight: FontWeight.black,
                          height: 1.1,
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.25),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                      child: Text(
                        '$correct Correct / $totalQ Total',
                        style: AppTextStyles.whiteSubtitleWithShadow.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                  )
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            // Metrics Grid
            GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: AppSpacing.lg,
                crossAxisSpacing: AppSpacing.lg,
                childAspectRatio: 1.5,
                children: [
                    _buildMetricCard(Icons.center_focus_strong, "Accuracy", "$accuracy%", AppColors.primaryBlue),
                    _buildMetricCard(Icons.timer, "Time Taken", "${(timeTaken/60).round()}m", Colors.orange),
                    _buildMetricCard(Icons.check_circle, "Correct", "$correct", Colors.green),
                    _buildMetricCard(Icons.cancel, "Incorrect", "$incorrect", AppColors.errorText),
                ],
            ),

            const SizedBox(height: 32),
            
            if (insights != null) ...[ 
              Text('AI Insights', style: AppTextStyles.h2),
              const SizedBox(height: 16),
              
              // Recommendation
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.blue.withOpacity(0.04),
                  border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.blue.withOpacity(0.1)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.auto_awesome, color: Colors.amber),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        insights['recommendation'] ?? 'Keep practicing to improve your score!',
                        style: TextStyle(
                          fontSize: 15, 
                          height: 1.5, 
                          color: isDark ? Colors.white70 : Colors.black87
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Strengths
              if (strengths.isNotEmpty) ...[
                  Text('Strengths', style: AppTextStyles.caption.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textTertiary,
                  )),
                  const SizedBox(height: 8),
                  Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: strengths.map((s) => Chip(
                          label: Text(s),
                          backgroundColor: Colors.green.shade50,
                          labelStyle: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold, fontSize: 12),
                          side: BorderSide.none,
                          padding: EdgeInsets.zero,
                          visualDensity: VisualDensity.compact,
                      )).toList(),
                  ),
                  const SizedBox(height: 24),
              ],
              
              // Topic Analysis
              if (topicAnalysis != null) ...[
                 Text('Topic Analysis', style: AppTextStyles.h2),
                  const SizedBox(height: 16),
                  ...topicAnalysis.entries.map((entry) {
                      final data = entry.value;
                      final tCorrect = data['correct'];
                      final tTotal = data['total'];
                      final tAcc = tTotal > 0 ? tCorrect/tTotal : 0.0;
                      
                      return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                              color: theme.cardTheme.color,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade100),
                              boxShadow: isDark ? [] : [BoxShadow(color: Colors.grey.shade100, blurRadius: 4, offset: const Offset(0, 2))]
                          ),
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                  Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                          Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                          Text('${(tAcc*100).round()}%', style: TextStyle(fontWeight: FontWeight.bold, color: _getColorForAcc(tAcc))),
                                      ],
                                  ),
                                  const SizedBox(height: 8),
                                  ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                          value: tAcc.toDouble(),
                                          backgroundColor: Colors.grey.shade100,
                                          valueColor: AlwaysStoppedAnimation<Color>(_getColorForAcc(tAcc)),
                                          minHeight: 6,
                                      ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text('$tCorrect / $tTotal Correct', style: const TextStyle(fontSize: 12, color: Colors.grey))
                              ],
                          ),
                      );
                  }),
              ]
            ],
            
            const SizedBox(height: 32),
            
            // Topper Comparison
            TopperComparisonWidget(userScore: score),
            
            const SizedBox(height: 32),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // Navigate back to test (retake)
                      Navigator.pop(context);
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retake Test'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                       Navigator.push(
                         context,
                         MaterialPageRoute(
                           builder: (_) => SolutionExplorerScreen(attemptId: widget.attemptId),
                         ),
                       );
                    },
                    icon: const Icon(Icons.reviews_outlined),
                    label: const Text('Review Questions'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
                icon: const Icon(Icons.grid_view),
                label: const Text('Choose Another'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey.shade900,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))
                ),
              ),
            ),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
  
  Color _getColorForAcc(num acc) {
      if (acc >= 0.8) return Colors.green;
      if (acc >= 0.5) return Colors.orange;
      return Colors.red;
  }
  
  Widget _buildMetricCard(IconData icon, String label, String value, Color color) {
      return Container(
          decoration: BoxDecoration(
              color: theme.cardTheme.color,
              borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
              border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
              boxShadow: isDark ? [] : AppShadows.small,
          ),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                  Icon(icon, color: color, size: AppSpacing.iconXl),
                  const SizedBox(height: AppSpacing.sm),
                  Text(label, style: AppTextStyles.caption.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.bold,
                  )),
                  const SizedBox(height: 2),
                  Text(value, style: AppTextStyles.h3.copyWith(
                    fontWeight: FontWeight.black,
                  )),
              ],
          ),
      );
  }
}
