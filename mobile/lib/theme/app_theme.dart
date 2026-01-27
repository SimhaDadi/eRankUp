import 'package:flutter/material.dart';

/// App-wide design constants for colors, typography, and spacing
/// Ensures consistency and accessibility across all screens

class AppColors {
  // Primary Colors
  static const primaryBlue = Color(0xFF2563EB);
  static const primaryCyan = Color(0xFF00BFA5);
  static const darkNavy = Color(0xFF0F172A);
  
  // Neutrals (IMPROVED CONTRAST)
  static const textPrimary = Color(0xFF1F2937);    // Gray 800 - Contrast 14:1
  static const textSecondary = Color(0xFF4B5563);  // Gray 600 - Contrast 7:1
  static const textTertiary = Color(0xFF6B7280);   // Gray 500 - Contrast 5:1
  static const textDisabled = Color(0xFF9CA3AF);   // Gray 400
  
  // Backgrounds
  static const bgPrimary = Color(0xFFFFFFFF);
  static const bgSecondary = Color(0xFFF9FAFB);    // Gray 50
  static const bgTertiary = Color(0xFFF3F4F6);     // Gray 100
  
  // Success (IMPROVED)
  static const successBg = Color(0xFFD1FAE5);      // Green 100
  static const successText = Color(0xFF065F46);    // Green 800 - Contrast 8:1
  static const successBorder = Color(0xFF6EE7B7);  // Green 300
  static const successDark = Color(0xFF047857);    // Green 700
  
  // Warning (IMPROVED)
  static const warningBg = Color(0xFFFEF3C7);      // Amber 100
  static const warningText = Color(0xFF92400E);    // Amber 800 - Contrast 7:1
  static const warningBorder = Color(0xFFFCD34D);  // Amber 300
  static const warningDark = Color(0xFFB45309);    // Amber 700
  
  // Error (IMPROVED)
  static const errorBg = Color(0xFFFEE2E2);        // Red 100
  static const errorText = Color(0xFF991B1B);      // Red 800 - Contrast 8:1
  static const errorBorder = Color(0xFFFCA5A5);    // Red 300
  static const errorDark = Color(0xFFDC2626);      // Red 600
  
  // Info
  static const infoBg = Color(0xFFDBEAFE);         // Blue 100
  static const infoText = Color(0xFF1E40AF);       // Blue 800 - Contrast 8:1
  static const infoBorder = Color(0xFF93C5FD);     // Blue 300
  
  // Gradients
  static const heroGradient = LinearGradient(
    colors: [primaryBlue, primaryCyan],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const liveGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFF97316)], // Red to Orange
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const premiumGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFEA580C)], // Amber to Orange
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const rankGradient = LinearGradient(
    colors: [Color(0xFF9333EA), Color(0xFF2563EB)], // Purple to Blue
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTextStyles {
  // Headers
  static const h1 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    height: 1.3,
  );
  
  static const h2 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    height: 1.4,
  );
  
  static const h3 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    height: 1.4,
  );
  
  static const h4 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.5,
  );
  
  // Body Text
  static const bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.6,
    color: AppColors.textPrimary,
  );
  
  static const body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.normal,
    height: 1.6,
  );
  
  static const bodySmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.6,
    color: AppColors.textSecondary,
  );
  
  // Captions (IMPROVED - minimum 13px)
  static const caption = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    height: 1.4,
    color: AppColors.textSecondary,
  );
  
  static const captionSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.4,
    color: AppColors.textTertiary,
  );
  
  // Buttons
  static const button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );
  
  static const buttonSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );
  
  // Special
  static const overline = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.bold,
    height: 1.2,
    letterSpacing: 1.2,
    color: AppColors.textTertiary,
  );
  
  // White text with shadow for gradients (IMPROVED CONTRAST)
  static const whiteWithShadow = TextStyle(
    color: Colors.white,
    shadows: [
      Shadow(
        color: Color(0x40000000), // 25% black
        blurRadius: 4,
        offset: Offset(0, 2),
      ),
    ],
  );
  
  static const whiteSubtitleWithShadow = TextStyle(
    color: Colors.white,
    shadows: [
      Shadow(
        color: Color(0x33000000), // 20% black
        blurRadius: 2,
        offset: Offset(0, 1),
      ),
    ],
  );
}

class AppSpacing {
  // Consistent spacing values
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  
  // Card margins (STANDARDIZED)
  static const double cardMargin = 16.0;
  static const double cardPadding = 16.0;
  
  // Screen padding
  static const double screenPadding = 20.0;
  
  // Border radius
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;
  static const double radiusXxl = 24.0;
  
  // Icon sizes
  static const double iconSm = 16.0;
  static const double iconMd = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  
  // Button heights
  static const double buttonHeight = 48.0;
  static const double buttonHeightSmall = 40.0;
  static const double buttonHeightLarge = 56.0;
}

class AppShadows {
  static const small = [
    BoxShadow(
      color: Color(0x0A000000), // 4% black
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
  
  static const medium = [
    BoxShadow(
      color: Color(0x14000000), // 8% black
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];
  
  static const large = [
    BoxShadow(
      color: Color(0x1F000000), // 12% black
      blurRadius: 16,
      offset: Offset(0, 8),
    ),
  ];
}

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: AppColors.primaryBlue,
      secondary: AppColors.primaryCyan,
      surface: AppColors.bgPrimary,
      error: AppColors.errorDark,
    ),
    scaffoldBackgroundColor: AppColors.bgSecondary,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.bgPrimary,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: false,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.darkNavy,
      contentTextStyle: AppTextStyles.bodySmall.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
      elevation: 6,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: Colors.white,
        textStyle: AppTextStyles.button,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.lg,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        minimumSize: const Size(0, AppSpacing.buttonHeight),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primaryBlue,
        textStyle: AppTextStyles.button,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.lg,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        side: BorderSide(color: Colors.grey.shade300, width: 1.5),
        minimumSize: const Size(0, AppSpacing.buttonHeight),
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: AppTextStyles.h1,
      displayMedium: AppTextStyles.h2,
      displaySmall: AppTextStyles.h3,
      headlineMedium: AppTextStyles.h4,
      bodyLarge: AppTextStyles.bodyLarge,
      bodyMedium: AppTextStyles.body,
      bodySmall: AppTextStyles.bodySmall,
      labelLarge: AppTextStyles.button,
      labelSmall: AppTextStyles.caption,
    ),
  );
  
  // Dark theme for future implementation
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryBlue,
      secondary: AppColors.primaryCyan,
      surface: AppColors.darkNavy,
      error: AppColors.errorDark,
      onSurface: Colors.white,
    ),
    scaffoldBackgroundColor: const Color(0xFF0F172A),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF0F172A),
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
    ),
    textTheme: TextTheme(
      displayLarge: AppTextStyles.h1.copyWith(color: Colors.white),
      displayMedium: AppTextStyles.h2.copyWith(color: Colors.white),
      displaySmall: AppTextStyles.h3.copyWith(color: Colors.white),
      headlineMedium: AppTextStyles.h4.copyWith(color: Colors.white),
      bodyLarge: AppTextStyles.bodyLarge.copyWith(color: Colors.white70),
      bodyMedium: AppTextStyles.body.copyWith(color: Colors.white70),
      bodySmall: AppTextStyles.bodySmall.copyWith(color: Colors.white60),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
      ),
    ),
  );
}
