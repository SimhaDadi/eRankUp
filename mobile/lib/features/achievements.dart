import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Achievement system for gamification
/// Tracks user milestones and provides rewards

class Achievement {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final int points;
  final bool unlocked;
  final double progress; // 0.0 to 1.0
  final DateTime? unlockedAt;

  Achievement({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.points,
    this.unlocked = false,
    this.progress = 0.0,
    this.unlockedAt,
  });

  static final List<Achievement> all = [
    Achievement(
      id: 'first_test',
      title: 'First Steps',
      description: 'Complete your first test',
      icon: Icons.flag,
      color: Colors.blue,
      points: 10,
    ),
    Achievement(
      id: 'perfect_score',
      title: 'Perfectionist',
      description: 'Score 100% in any test',
      icon: Icons.stars,
      color: Colors.amber,
      points: 50,
    ),
    Achievement(
      id: 'week_streak',
      title: 'Dedicated',
      description: 'Practice for 7 days straight',
      icon: Icons.local_fire_department,
      color: Colors.orange,
      points: 30,
    ),
    Achievement(
      id: 'high_scorer',
      title: 'High Achiever',
      description: 'Score above 90% in 5 tests',
      icon: Icons.emoji_events,
      color: Colors.green,
      points: 40,
    ),
    Achievement(
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Complete a test in under 30 minutes',
      icon: Icons.flash_on,
      color: Colors.purple,
      points: 25,
    ),
    Achievement(
      id: 'knowledge_seeker',
      title: 'Knowledge Seeker',
      description: 'Complete 50 tests',
      icon: Icons.school,
      color: Colors.indigo,
      points: 100,
    ),
    Achievement(
      id: 'top_ten',
      title: 'Top 10',
      description: 'Reach top 10 on the leaderboard',
      icon: Icons.workspace_premium,
      color: Colors.red,
      points: 75,
    ),
    Achievement(
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Share your results 5 times',
      icon: Icons.share,
      color: Colors.pink,
      points: 20,
    ),
  ];
}

/// Achievement unlocked dialog
class AchievementUnlockedDialog extends StatefulWidget {
  final Achievement achievement;

  const AchievementUnlockedDialog({
    super.key,
    required this.achievement,
  });

  @override
  State<AchievementUnlockedDialog> createState() =>
      _AchievementUnlockedDialogState();
}

class _AchievementUnlockedDialogState extends State<AchievementUnlockedDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.elasticOut,
      ),
    );

    _rotationAnimation = Tween<double>(begin: -0.2, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOut,
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated trophy icon
            ScaleTransition(
              scale: _scaleAnimation,
              child: RotationTransition(
                turns: _rotationAnimation,
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: widget.achievement.color.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    widget.achievement.icon,
                    size: 60,
                    color: widget.achievement.color,
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Achievement Unlocked!',
              style: AppTextStyles.h3.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              widget.achievement.title,
              style: AppTextStyles.h2,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              widget.achievement.description,
              style: AppTextStyles.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: widget.achievement.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
              ),
              child: Text(
                '+${widget.achievement.points} XP',
                style: TextStyle(
                  color: widget.achievement.color,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Awesome!'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Achievement card widget
class AchievementCard extends StatelessWidget {
  final Achievement achievement;

  const AchievementCard({
    super.key,
    required this.achievement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: achievement.unlocked
            ? AppColors.bgPrimary
            : AppColors.bgTertiary,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: achievement.unlocked
              ? achievement.color.withOpacity(0.3)
              : Colors.grey.shade300,
        ),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: achievement.unlocked
                  ? achievement.color.withOpacity(0.2)
                  : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Icon(
              achievement.icon,
              color: achievement.unlocked
                  ? achievement.color
                  : Colors.grey.shade400,
              size: AppSpacing.iconXl,
            ),
          ),
          const SizedBox(width: AppSpacing.lg),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  achievement.title,
                  style: AppTextStyles.h4.copyWith(
                    color: achievement.unlocked
                        ? AppColors.textPrimary
                        : AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  achievement.description,
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (!achievement.unlocked && achievement.progress > 0) ...[
                  const SizedBox(height: AppSpacing.sm),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    child: LinearProgressIndicator(
                      value: achievement.progress,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        achievement.color,
                      ),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${(achievement.progress * 100).toInt()}% Complete',
                    style: AppTextStyles.captionSmall.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Points
          Column(
            children: [
              Text(
                '${achievement.points}',
                style: AppTextStyles.h3.copyWith(
                  color: achievement.unlocked
                      ? achievement.color
                      : AppColors.textTertiary,
                  fontWeight: FontWeight.black,
                ),
              ),
              Text(
                'XP',
                style: AppTextStyles.captionSmall.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Achievements screen
class AchievementsScreen extends StatelessWidget {
  final List<Achievement> achievements;
  final int totalXP;

  const AchievementsScreen({
    super.key,
    required this.achievements,
    required this.totalXP,
  });

  @override
  Widget build(BuildContext context) {
    final unlockedCount = achievements.where((a) => a.unlocked).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Achievements'),
      ),
      body: Column(
        children: [
          // Header stats
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              gradient: AppColors.heroGradient,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStat(
                  'Unlocked',
                  '$unlockedCount/${achievements.length}',
                  Icons.emoji_events,
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.white.withOpacity(0.3),
                ),
                _buildStat(
                  'Total XP',
                  '$totalXP',
                  Icons.stars,
                ),
              ],
            ),
          ),

          // Achievement list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              itemCount: achievements.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) {
                return AchievementCard(
                  achievement: achievements[index],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 32),
        const SizedBox(height: AppSpacing.sm),
        Text(
          value,
          style: AppTextStyles.h2.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.black,
          ),
        ),
        Text(
          label,
          style: AppTextStyles.caption.copyWith(
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}
