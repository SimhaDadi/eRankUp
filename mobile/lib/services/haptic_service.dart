import 'package:flutter/services.dart';

/// Centralized service for haptic feedback patterns
/// Provides a premium tactile feel to the application
class HapticService {
  /// Subtle tap for selecting options or toggling small switches
  static Future<void> light() async {
    await HapticFeedback.lightImpact();
  }

  /// Medium impact for main button presses or finishing a sub-section
  static Future<void> medium() async {
    await HapticFeedback.mediumImpact();
  }

  /// Success feedback for correct answers or completed goals
  static Future<void> success() async {
    // Custom sequence for success
    await HapticFeedback.lightImpact();
    await Future.delayed(const Duration(milliseconds: 50));
    await HapticFeedback.mediumImpact();
  }

  /// Error feedback for incorrect answers or failed validations
  static Future<void> error() async {
    await HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 100));
    await HapticFeedback.heavyImpact();
  }

  /// Special "pulsing" vibration for achievement alerts
  static Future<void> ultraSuccess() async {
    for (int i = 0; i < 3; i++) {
        await HapticFeedback.mediumImpact();
        await Future.delayed(const Duration(milliseconds: 80));
    }
  }
}
