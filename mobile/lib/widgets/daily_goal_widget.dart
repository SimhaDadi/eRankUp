import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'dart:math' as math;

class DailyGoalWidget extends StatelessWidget {
  final int currentQuestions;
  final int targetQuestions;

  const DailyGoalWidget({
    super.key,
    required this.currentQuestions,
    this.targetQuestions = 100,
  });

  @override
  Widget build(BuildContext context) {
    final double progress = (currentQuestions / targetQuestions).clamp(0.0, 1.0);
    final int percentage = (progress * 100).round();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        boxShadow: AppShadows.medium,
        border: Border.all(color: Colors.white.withOpacity(0.6)),
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
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.grey.shade100),
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
                      fontWeight: FontWeight.black,
                      height: 1.0,
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
                    color: AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$currentQuestions / $targetQuestions questions',
                  style: AppTextStyles.h3.copyWith(
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  progress >= 1.0 
                      ? "Goal achieved! You're on fire! 🔥" 
                      : "Keep going! You're doing great. 🚀",
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
