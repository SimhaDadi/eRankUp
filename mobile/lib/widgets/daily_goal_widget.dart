import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'dart:math' as math;

class DailyGoalWidget extends StatelessWidget {
  final int currentQuestions;
  final int targetQuestions;
  final VoidCallback? onEditGoal;

  const DailyGoalWidget({
    super.key,
    required this.currentQuestions,
    this.targetQuestions = 100,
    this.onEditGoal,
  });

  @override
  Widget build(BuildContext context) {
    final double progress = (currentQuestions / math.max(targetQuestions, 1)).clamp(0.0, 1.0);
    final int percentage = (progress * 100).round();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        boxShadow: isDark ? [] : AppShadows.medium,
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.white.withOpacity(0.6)),
      ),
      child: Row(
        children: [
          // Circular Progress
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 80,
                height: 80,
                child: CircularProgressIndicator(
                  value: 1.0,
                  strokeWidth: 8,
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
                ),
              ),
              SizedBox(
                width: 80,
                height: 80,
                child: ShaderMask(
                  shaderCallback: (rect) {
                    return AppColors.heroGradient.createShader(rect);
                  },
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 8,
                    strokeCap: StrokeCap.round,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$percentage%',
                    style: AppTextStyles.h3.copyWith(
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                      color: theme.textTheme.bodyLarge?.color,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(width: AppSpacing.xl),
          // Text Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Daily Goal',
                  style: AppTextStyles.overline.copyWith(
                    color: isDark ? Colors.white38 : AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        progress >= 1.0 
                            ? "Goal achieved! You're on fire! 🔥" 
                            : "Keep going! You're doing great. 🚀",
                        style: AppTextStyles.caption.copyWith(
                          color: isDark ? Colors.white60 : AppColors.textSecondary,
                        ),
                      ),
                    ),
                    if (onEditGoal != null)
                      GestureDetector(
                        onTap: onEditGoal,
                        child: Text(
                          'Set Goal',
                          style: AppTextStyles.captionSmall.copyWith(
                            color: AppColors.primaryCyan,
                            fontWeight: FontWeight.bold,
                            decoration: TextDecoration.underline,
                          ),
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
}
