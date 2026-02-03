import 'package:flutter/material.dart';

/// App-wide design constants for colors, typography, and spacing
/// Ensures consistency and accessibility across all screens

class AppColors {
  // Premium Palette (Deep Indigo & Vibrant Accents)
  static const primaryBlue = Color(0xFF4338CA); // Indigo 700 - Primary Brand Color
  static const primaryLight = Color(0xFF6366F1); // Indigo 500
  static const primaryDark = Color(0xFF312E81); // Indigo 900
  
  static const primaryCyan = Color(0xFF0EA5E9); // Sky 500
  static const primaryGold = Color(0xFFF59E0B); // Amber 500
  
  static const darkNavy = Color(0xFF0F172A); // Slate 900
  
  // Neutrals 
  static const textPrimary = Color(0xFF1E293B);    // Slate 800 - High Contrast
  static const textSecondary = Color(0xFF64748B);  // Slate 500 - Subtitles
  static const textTertiary = Color(0xFF94A3B8);   // Slate 400
  static const textDisabled = Color(0xFFCBD5E1);   // Slate 300
  
  // Backgrounds
  static const bgPrimary = Color(0xFFFFFFFF);      // Pure White
  static const bgSecondary = Color(0xFFF8FAFC);    // Slate 50 - Very subtle gray
  static const bgTertiary = Color(0xFFF1F5F9);     // Slate 100
  static const divider = Color(0xFFE2E8F0);        // Slate 200
  static const cardBackground = bgPrimary;         
  
  // Success
  static const successBg = Color(0xFFDCFCE7);      // Emerald 100
  static const successText = Color(0xFF15803D);    // Emerald 700
  static const successBorder = Color(0xFF86EFAC);  // Emerald 300
  static const successDark = Color(0xFF16A34A);    // Emerald 600
  
  // Warning
  static const warningBg = Color(0xFFFEF3C7);      // Amber 100
  static const warningText = Color(0xFFB45309);    // Amber 700
  static const warningBorder = Color(0xFFFCD34D);  // Amber 300
  static const warningDark = Color(0xFFB45309);    // Amber 700
  
  // Error
  static const errorBg = Color(0xFFFEE2E2);        // Red 100
  static const errorText = Color(0xFFB91C1C);      // Red 700
  static const errorBorder = Color(0xFFFCA5A5);    // Red 300
  static const errorDark = Color(0xFFDC2626);      // Red 600

  // Info
  static const infoBg = Color(0xFFE0F2FE);         // Sky 100
  static const infoText = Color(0xFF0369A1);       // Sky 700
  static const infoBorder = Color(0xFF7DD3FC);     // Sky 300
  
  // Custom Gradients
  static const heroGradient = LinearGradient(
    colors: [Color(0xFF4338CA), Color(0xFF3730A3)], // Indigo 700 -> Indigo 800
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const goldGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)], 
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const liveGradient = LinearGradient(
    colors: [Color(0xFF1E293B), Color(0xFF4338CA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const premiumGradient = LinearGradient(
    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const rankGradient = LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)], // Violet
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTextStyles {
  // Headers
  // Headers - Bolder and Darker
  static const h1 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w800, // Extra Bold
    height: 1.3,
    color: AppColors.textPrimary,
    fontFamily: 'Roboto', // Assuming default, but explicit is good
  );
  
  static const h2 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    height: 1.3,
    color: AppColors.textPrimary,
  );
  
  static const h3 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    height: 1.3,
    color: AppColors.textPrimary,
  );
  
  static const h4 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    height: 1.4,
    color: AppColors.textPrimary,
  );
  
  // Body Text
  static const bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
    color: AppColors.textPrimary,
  );
  
  static const body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.normal,
    height: 1.5,
    color: AppColors.textSecondary,
  );
  
  static const bodySmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.5,
    color: AppColors.textSecondary,
  );
  
  // Captions
  static const caption = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.textTertiary,
  );
  
  static const captionSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
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
  
  // Border radius - More rounded as per modern guidelines
  static const double radiusSm = 8.0;
  static const double radiusMd = 16.0; // Increased
  static const double radiusLg = 24.0; // Increased
  static const double radiusXl = 32.0; // Increased
  static const double radiusXxl = 40.0;
  
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
  static ThemeData lightTheme = ThemeData.light().copyWith(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: AppColors.primaryBlue,
      onPrimary: Colors.white,
      secondary: AppColors.primaryLight,
      surface: AppColors.bgPrimary,
      error: AppColors.errorDark,
    ),
    scaffoldBackgroundColor: AppColors.bgSecondary,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.bgPrimary,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: false,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w900,
        color: AppColors.textPrimary,
        letterSpacing: -0.5,
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.bgPrimary,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100), // Pill style inputs
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100),
        borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
      ),
    ),
    dividerColor: Colors.transparent, // Remove line under tab bars globally
    tabBarTheme: TabBarThemeData(
      labelColor: Colors.white,
      unselectedLabelColor: AppColors.textSecondary,
      indicatorSize: TabBarIndicatorSize.tab,
      indicator: BoxDecoration(
        color: AppColors.primaryBlue,
        borderRadius: BorderRadius.circular(100),
      ),
      labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.2),
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: AppColors.primaryBlue.withOpacity(0.12),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return IconThemeData(color: AppColors.primaryBlue, size: 28);
        }
        return IconThemeData(color: AppColors.textSecondary, size: 24);
      }),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return AppTextStyles.captionSmall.copyWith(
            color: AppColors.primaryBlue,
            fontWeight: FontWeight.w900,
            fontSize: 11,
          );
        }
        return AppTextStyles.captionSmall.copyWith(
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w600,
          fontSize: 11,
        );
      }),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryBlue,
      secondary: AppColors.primaryLight,
      surface: AppColors.darkNavy,
      error: AppColors.errorDark,
    ),
    scaffoldBackgroundColor: const Color(0xFF0F172A),
  );
}
