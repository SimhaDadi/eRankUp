import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class TopperComparisonWidget extends StatelessWidget {
  final int userScore;
  
  const TopperComparisonWidget({
    super.key,
    required this.userScore,
  });

  List<Map<String, dynamic>> _generateTopperStats() {
    final topics = ['Algebra', 'Geometry', 'Arithmetic', 'Reasoning'];
    
    return topics.map((topic) {
      // Simulate user score for this topic based on overall score + random variance
      final variance = (DateTime.now().millisecondsSinceEpoch % 20) - 10;
      final yourScore = (userScore + variance).clamp(0, 100);
      
      // Topper is usually 10-15% ahead, capped at 100
      final topperScore = (yourScore + 5 + (DateTime.now().millisecondsSinceEpoch % 15)).clamp(0, 100);
      
      return {
        'topic': topic,
        'yourScore': yourScore,
        'topperScore': topperScore,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final stats = _generateTopperStats();
    final screenWidth = MediaQuery.of(context).size.width;
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.indigo.shade50,
            Colors.blue.shade50,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        border: Border.all(color: Colors.blue.shade100, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade600,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade600.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.emoji_events, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'vs. Top Scorers',
                      style: AppTextStyles.h2.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      'Benchmark your subject mastery against the top 1%.',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.amber.shade100,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: Colors.amber.shade200),
            ),
            child: Text(
              'Competitive Analytics',
              style: AppTextStyles.caption.copyWith(
                fontWeight: FontWeight.black,
                color: Colors.amber.shade800,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          // Topic Comparisons
          ...stats.map((stat) => _buildTopicComparison(
            stat['topic'] as String,
            stat['yourScore'] as int,
            stat['topperScore'] as int,
          )),
          
          const SizedBox(height: 16),
          
          // Insight
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline, color: Colors.amber.shade700, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _generateInsight(stats),
                    style: const TextStyle(
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                      color: Colors.black87,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopicComparison(String topic, int yourScore, int topperScore) {
    final gap = topperScore - yourScore;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                topic,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: gap > 10 ? Colors.red.shade50 : Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      gap > 10 ? Icons.trending_down : Icons.trending_up,
                      size: 14,
                      color: gap > 10 ? Colors.red.shade700 : Colors.green.shade700,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${gap.abs()}% gap',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: gap > 10 ? Colors.red.shade700 : Colors.green.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Progress bars
          Row(
            children: [
              const SizedBox(
                width: 40,
                child: Text(
                  'You',
                  style: TextStyle(fontSize: 11, color: Colors.black54),
                ),
              ),
              Expanded(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: yourScore / 100,
                      child: Container(
                        height: 8,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.blue.shade400, Colors.blue.shade600],
                          ),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    // Label with boundary check
                    if (yourScore > 5 && yourScore < 95)
                      Positioned(
                        left: ((yourScore / 100) * (screenWidth - 120)).clamp(30.0, screenWidth - 150),
                        top: -24,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade700,
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: AppShadows.small,
                          ),
                          child: Text(
                            'You: $yourScore%',
                            style: AppTextStyles.captionSmall.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 40,
                child: Text(
                  '100%',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const SizedBox(
                width: 40,
                child: Text(
                  'Top',
                  style: TextStyle(fontSize: 11, color: Colors.black54),
                ),
              ),
              Expanded(
                child: Stack(
                  children: [
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: topperScore / 100,
                      child: Container(
                        height: 8,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.amber.shade400, Colors.amber.shade600],
                          ),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    Positioned(
                      left: (topperScore / 100) * MediaQuery.of(context as BuildContext).size.width * 0.6,
                      top: -20,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade600,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Top: $topperScore%',
                          style: const TextStyle(
                            fontSize: 9,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 40,
                child: Text(
                  '100%',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _generateInsight(List<Map<String, dynamic>> stats) {
    // Find topic with smallest gap
    var bestTopic = stats[0];
    var smallestGap = (stats[0]['topperScore'] as int) - (stats[0]['yourScore'] as int);
    
    for (var stat in stats) {
      final gap = (stat['topperScore'] as int) - (stat['yourScore'] as int);
      if (gap < smallestGap) {
        smallestGap = gap;
        bestTopic = stat;
      }
    }
    
    if (smallestGap <= 5) {
      return "You're within 5% of the top scorers in ${bestTopic['topic']}. Push a bit harder!";
    } else if (smallestGap <= 10) {
      return "You're making good progress in ${bestTopic['topic']}. Keep practicing!";
    } else {
      return "Focus on ${bestTopic['topic']} to close the gap with top performers.";
    }
  }
}
