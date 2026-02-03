import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../theme/app_theme.dart';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'dart:io';
import 'dart:typed_data';
import 'package:intl/intl.dart';

import '../services/haptic_service.dart';

class DailyGoalWidget extends StatefulWidget {
  final int currentQuestions;
  final int targetQuestions;
  final String? goalLabel;
  final String? userId;
  final VoidCallback? onEditGoal;

  const DailyGoalWidget({
    super.key,
    required this.currentQuestions,
    this.targetQuestions = 100,
    this.goalLabel,
    this.userId,
    this.onEditGoal,
  });

  @override
  State<DailyGoalWidget> createState() => _DailyGoalWidgetState();
}

class _DailyGoalWidgetState extends State<DailyGoalWidget> with SingleTickerProviderStateMixin {
  final GlobalKey _globalKey = GlobalKey();
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isSharing = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _shareProgressAsImage(_ModeConfig config) async {
    if (_isSharing) return;
    
    setState(() => _isSharing = true);
    HapticService.medium();

    try {
      // Small delay to ensure any touch ripple animation finishes before capture
      await Future.delayed(const Duration(milliseconds: 200));

      RenderRepaintBoundary? boundary = _globalKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;

      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      final directory = await getTemporaryDirectory();
      final imagePath = await File('${directory.path}/eru_achievement.png').create();
      await imagePath.writeAsBytes(pngBytes);

      final String message = "I just smashed my daily goal on eRankUp! 🦁🔥\n\nDownload eRankUp to boost your prep! 🚀";

      await Share.shareXFiles(
        [XFile(imagePath.path)],
        text: message,
      );
    } catch (e) {
      debugPrint("Error sharing achievement image: $e");
    } finally {
      if (mounted) {
        setState(() => _isSharing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final double progress = (widget.currentQuestions / math.max(widget.targetQuestions, 1)).clamp(0.0, 1.0);
    final int percentage = (progress * 100).round();
    
    final config = _getModeConfig(widget.goalLabel);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final String now = DateFormat('MMM d, yyyy • h:mm a').format(DateTime.now());
    final String verificationId = (widget.userId ?? 'GUEST') + widget.currentQuestions.toString() + DateTime.now().minute.toString();
    final String shortHash = verificationId.hashCode.abs().toString().padLeft(8, '0').substring(0, 8).toUpperCase();

    return RepaintBoundary(
      key: _globalKey,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          boxShadow: [
            BoxShadow(
              color: config.primaryColor.withOpacity(0.15),
              blurRadius: 40,
              offset: const Offset(0, 20),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
          child: Container(
            decoration: BoxDecoration(
              color: theme.cardTheme.color,
              border: Border.all(color: config.primaryColor.withOpacity(0.3), width: 1.5),
            ),
            child: Stack(
              children: [
                // 1. Holographic Pattern Background
                Positioned.fill(
                  child: CustomPaint(
                    painter: _HolographicPainter(
                      color: config.primaryColor.withOpacity(0.03),
                    ),
                  ),
                ),
                // 2. Verified Seal Watermark
                Positioned(
                  right: -20,
                  top: -20,
                  child: Opacity(
                    opacity: 0.05,
                    child: Icon(Icons.verified, size: 140, color: config.primaryColor),
                  ),
                ),
                // 3. Main Content
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      child: Row(
                        children: [
                          // Circular Progress with breathing animation
                          Stack(
                            alignment: Alignment.center,
                            children: [
                              // Breathing Glow
                              ScaleTransition(
                                scale: _pulseAnimation,
                                child: Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: config.primaryColor.withOpacity(0.3 * progress),
                                        blurRadius: 20,
                                        spreadRadius: 5,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              // Background Track
                              SizedBox(
                                width: 76,
                                height: 76,
                                child: CircularProgressIndicator(
                                  value: 1.0,
                                  strokeWidth: 8,
                                  backgroundColor: Colors.transparent,
                                  valueColor: AlwaysStoppedAnimation<Color>(isDark ? Colors.white10 : Colors.grey.shade100),
                                ),
                              ),
                              // Main Progress
                              SizedBox(
                                width: 76,
                                height: 76,
                                child: ShaderMask(
                                  shaderCallback: (rect) {
                                    return config.gradient.createShader(rect);
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
                              Text(
                                '$percentage%',
                                style: AppTextStyles.h3.copyWith(
                                  fontWeight: FontWeight.w900,
                                  height: 1.0,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: AppSpacing.xl),
                          // Text Content
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        gradient: config.gradient,
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color: config.primaryColor.withOpacity(0.4),
                                            blurRadius: 12,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(config.icon, color: Colors.white, size: 14),
                                          const SizedBox(width: 4),
                                          Text(
                                            config.badgeText.toUpperCase(),
                                            style: AppTextStyles.overline.copyWith(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w900,
                                              letterSpacing: 0.8,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      icon: Opacity(
                                        opacity: _isSharing ? 0.5 : 1.0,
                                        child: Container(
                                          padding: const EdgeInsets.all(6),
                                          decoration: BoxDecoration(
                                            color: config.primaryColor.withOpacity(0.1),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            _isSharing ? Icons.sync_rounded : Icons.share_rounded, 
                                            size: 18, 
                                            color: config.primaryColor
                                          ),
                                        ),
                                      ),
                                      onPressed: () => _shareProgressAsImage(config),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  percentage >= 100 
                                      ? config.completionMessage 
                                      : config.motivationalMessage,
                                  style: AppTextStyles.h4.copyWith(
                                    fontSize: 15,
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w800,
                                    height: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                GestureDetector(
                                  onTap: widget.onEditGoal,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'UPGRADE MODE',
                                        style: AppTextStyles.captionSmall.copyWith(
                                          color: config.primaryColor,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      Icon(Icons.chevron_right_rounded, size: 14, color: config.primaryColor),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Enhanced Authentic Footer
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: 12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            config.primaryColor.withOpacity(0.08),
                            config.primaryColor.withOpacity(0.02),
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        border: Border(top: BorderSide(color: config.primaryColor.withOpacity(0.15), width: 1)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.fingerprint_rounded, size: 10, color: config.primaryColor.withOpacity(0.6)),
                                  const SizedBox(width: 4),
                                  Text(
                                    'STUDENT ID: ${widget.userId?.substring(0, math.min(10, widget.userId?.length ?? 0)) ?? "ERANK-GUEST"}',
                                    style: AppTextStyles.captionSmall.copyWith(
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.textSecondary,
                                      letterSpacing: 0.5,
                                      fontSize: 9,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'VERIFIED MOMENT: $now',
                                style: AppTextStyles.captionSmall.copyWith(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary.withOpacity(0.5),
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: config.primaryColor.withOpacity(0.2)),
                              boxShadow: [
                                BoxShadow(
                                  color: config.primaryColor.withOpacity(0.1),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.shield_rounded, size: 12, color: config.primaryColor),
                                const SizedBox(width: 4),
                                Text(
                                  'ERU-$shortHash',
                                  style: AppTextStyles.captionSmall.copyWith(
                                    fontWeight: FontWeight.w900,
                                    color: config.primaryColor,
                                    letterSpacing: 1.2,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  _ModeConfig _getModeConfig(String? label) {
    final l = label?.toLowerCase() ?? '';
    if (l.contains('beast')) {
      return _ModeConfig(
        badgeText: 'Beast Mode',
        icon: Icons.bolt_rounded,
        gradient: const LinearGradient(
          colors: [Color(0xFFFFD700), Color(0xFFFFA500), Color(0xFFFF8C00)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        primaryColor: const Color(0xFFF59E0B), // Amber 500
        completionMessage: "APEX ACHIEVED! YOU'RE ON FIRE! 🔥",
        motivationalMessage: "KEEP GOING! UNLEASH THE BEAST. 🦁",
        shareMessage: "I just smashed my daily goal in BEAST MODE on eRankUp! 🦁🔥 Join me!",
      );
    }
    if (l.contains('warrior')) {
      return _ModeConfig(
        badgeText: 'Warrior Mode',
        icon: Icons.shield_rounded,
        gradient: const LinearGradient(
          colors: [Color(0xFFEF4444), Color(0xFFDC2626), Color(0xFF991B1B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        primaryColor: const Color(0xFFEF4444),
        completionMessage: "VICTORY! WARRIOR GOAL MET! ⚔️",
        motivationalMessage: "CHARGE AHEAD! NEARLY THERE. 🛡️",
        shareMessage: "I'm fighting my way to the top in Warrior Mode on eRankUp! ⚔️ Join the battle!",
      );
    }
    if (l.contains('pro')) {
      return _ModeConfig(
        badgeText: 'Pro Mode',
        icon: Icons.stars_rounded,
        gradient: const LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF3730A3)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        primaryColor: const Color(0xFF6366F1),
        completionMessage: "PROFESSIONAL FINISH! 🎯",
        motivationalMessage: "FOCUS ON THE TARGET. 🎯",
        shareMessage: "Pro Mode activated! 🎯 My prep is on point with eRankUp. Join me!",
      );
    }
    if (l.contains('steady')) {
      return _ModeConfig(
        badgeText: 'Steady Mode',
        icon: Icons.trending_up_rounded,
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669), Color(0xFF065F46)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        primaryColor: const Color(0xFF10B981),
        completionMessage: "CONSISTENT GROWTH! 🐢",
        motivationalMessage: "SLOW AND STEADY WINS THE RACE. 🍀",
        shareMessage: "Maintaining consistency with Steady Mode on eRankUp! 🐢 Join the growth!",
      );
    }
    // Starter
    return _ModeConfig(
      badgeText: 'Starter',
      icon: Icons.egg_rounded,
      gradient: const LinearGradient(
        colors: [Color(0xFF94A3B8), Color(0xFF64748B), Color(0xFF334155)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      primaryColor: const Color(0xFF64748B),
      completionMessage: "FIRST STEP COMPLETED! 🐣",
      motivationalMessage: "GREAT START! AIM HIGHER. 🚀",
      shareMessage: "Started my journey on eRankUp today! 🐣 Check out this amazing app!",
    );
  }
}

class _HolographicPainter extends CustomPainter {
  final Color color;
  _HolographicPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    const spacing = 20.0;
    for (double i = -size.height; i < size.width; i += spacing) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ModeConfig {
  final String badgeText;
  final IconData icon;
  final LinearGradient gradient;
  final Color primaryColor;
  final String completionMessage;
  final String motivationalMessage;
  final String shareMessage;

  _ModeConfig({
    required this.badgeText,
    required this.icon,
    required this.gradient,
    required this.primaryColor,
    required this.completionMessage,
    required this.motivationalMessage,
    required this.shareMessage,
  });
}

