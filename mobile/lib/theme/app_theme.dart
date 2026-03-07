import 'package:flutter/material.dart';

/// App-wide design constants for colors, typography, and spacing
/// Ensures consistency and accessibility across all screens

class AppColors {
  // Gamified Neon Palette (Ultra-Modern, Duolingo-like Vibrancy)
  static const primaryBlue = Color(0xFF3366FF); // Electric Blue
  static const primaryHover = Color(0xFF66B2FF); // Bright Hover Blue
  static const primaryLight = Color(0xFF6690FF); // Glow Blue
  static const primaryDark = Color(0xFF1939B7); // Deep Blue
  
  static const primaryCyan = Color(0xFF00E5FF); // Neon Cyan
  static const primaryGold = Color(0xFFFFB300); // Amber Sunset
  static const primaryPink = Color(0xFFFF007F); // Cyber Pink
  static const primaryPurple = Color(0xFFA200FF); // Neon Purple
  
  static const darkNavy = Color(0xFF0A0F24); // Abyss Navy (Extra Dark)
  
  // Neutrals 
  static const textPrimary = Color(0xFF0F1F3D);    // Dark Navy – visible in light mode
  static const textSecondary = Color(0xFF4A5568);  // Slate 600 – good contrast
  static const textTertiary = Color(0xFF718096);   // Slate 500 – subtle
  static const textDisabled = Color(0xFFA0AEC0);   // Slate 400 – disabled
  
  // Backgrounds
  static const bgPrimary = Color(0xFFFFFFFF);      // Light Mode default
  static const bgSecondary = Color(0xFFF7FAFC);    // Extra tight slate
  static const bgTertiary = Color(0xFFEDF2F7);     // Slate 200
  static const divider = Color(0xFFE2E8F0);        
  static const cardBackground = bgPrimary;         
  
  // Success
  static const successBg = Color(0xFFE6FFFA);      
  static const successText = Color(0xFF00C896);    // Neon Mint
  static const successBorder = Color(0xFF00FFC2);  
  static const successDark = Color(0xFF009973);    
  
  // Warning
  static const warningBg = Color(0xFFFFFBEB);      
  static const warningText = Color(0xFFFF9900);    // Neon Orange
  static const warningBorder = Color(0xFFFFD600);  
  static const warningDark = Color(0xFFCC7A00);    
  
  // Error
  static const errorBg = Color(0xFFFFF5F5);        
  static const errorText = Color(0xFFFF3366);      // Neon Red/Pink
  static const errorBorder = Color(0xFFFF6680);    
  static const errorDark = Color(0xFFCC0033);      
  
  // Info
  static const infoBg = Color(0xFFEBF8FF);         
  static const infoText = Color(0xFF00AAFF);       
  static const infoBorder = Color(0xFF33BBFF);     
  
  // Custom Gradients (Mesh & Neon)
  static const heroGradient = LinearGradient(
    colors: [Color(0xFFA200FF), Color(0xFF3366FF)], // Purple to Blue
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const goldGradient = LinearGradient(
    colors: [Color(0xFFFFB300), Color(0xFFFF6B00)], // Amber to Bright Orange
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const liveGradient = LinearGradient(
    colors: [Color(0xFFFF007F), Color(0xFFA200FF)], // Pink to Purple
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const premiumGradient = LinearGradient(
    colors: [Color(0xFF00E5FF), Color(0xFF3366FF)], // Cyan to Blue
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const rankGradient = LinearGradient(
    colors: [Color(0xFF3366FF), Color(0xFFFF007F)], // Blue to Pink Checkpoint
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTextStyles {
  // Gamified Bold Headers
  static const h1 = TextStyle(
    fontFamily: 'Nunito',
    fontSize: 28,
    fontWeight: FontWeight.w900,
    height: 1.1,
    // No color—inherits from theme
    letterSpacing: -0.8,
  );
  
  static const h2 = TextStyle(
    fontFamily: 'Nunito',
    fontSize: 22,
    fontWeight: FontWeight.w800,
    height: 1.2,
    // No color—inherits from theme
    letterSpacing: -0.4,
  );
  
  static const h3 = TextStyle(
    fontFamily: 'Nunito',
    fontSize: 18,
    fontWeight: FontWeight.w700,
    height: 1.3,
    // No color—inherits from theme
    letterSpacing: -0.2,
  );
  
  static const h4 = TextStyle(
    fontFamily: 'Nunito',
    fontSize: 16,
    fontWeight: FontWeight.w700,
    height: 1.3,
    // No color—inherits from theme
  );
  
  // Body Text
  static const bodyLarge = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    height: 1.5,
    // No color—inherits from theme
  );
  
  static const body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w500,
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
    fontWeight: FontWeight.w700,
    height: 1.4,
    color: AppColors.textTertiary,
    letterSpacing: 0.3,
  );
  
  static const captionSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 1.4,
    // No color—inherits from theme
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
    fontWeight: FontWeight.w700, // Reduced from bold/w900
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
  static const double screenPadding = 24.0;
  
  // Card margins (STANDARDIZED)
  static const double cardMargin = 16.0;
  static const double cardPadding = 20.0; // Slightly more breathable
  
  // Gamified Ultra-Round Border radius
  static const double radiusSm = 12.0;
  static const double radiusMd = 24.0; // Bulky, friendly cards
  static const double radiusLg = 32.0; // Hero sections
  static const double radiusXl = 40.0; 
  static const double radiusXxl = 48.0;
  static const double radiusPill = 100.0;
  
  // Icon sizes
  static const double iconSm = 16.0;
  static const double iconMd = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  
  // Button heights
  static const double buttonHeight = 56.0; // Taller, tap-friendly
  static const double buttonHeightSmall = 44.0;
  static const double buttonHeightLarge = 64.0;
}

class AppShadows {
  // Glowing Neon & Deep Shadows for Gamified Look
  static const small = [
    BoxShadow(
      color: Color(0x1A000000), 
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];
  
  static const medium = [
    BoxShadow(
      color: Color(0x263366FF), // Glowing Blue Tint
      blurRadius: 24,
      offset: Offset(0, 12),
    ),
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];
  
  static const large = [
    BoxShadow(
      color: Color(0x403366FF), // Strong Glow
      blurRadius: 32,
      offset: Offset(0, 16),
    ),
    BoxShadow(
      color: Color(0x26000000),
      blurRadius: 16,
      offset: Offset(0, 8),
    ),
  ];

  static const neonPink = [
    BoxShadow(
      color: Color(0x66FF007F), // Vivid Pink Glow
      blurRadius: 24,
      spreadRadius: 2,
      offset: Offset(0, 8),
    ),
  ];

  static const neonCyan = [
    BoxShadow(
      color: Color(0x6600E5FF), // Vivid Cyan Glow
      blurRadius: 24,
      spreadRadius: 2,
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
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.bgPrimary,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: false,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700, // Reduced from w900
        color: AppColors.textPrimary,
        letterSpacing: -0.5,
      ),
      shape: const Border(
        bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1), // Sharp separator
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.bgPrimary,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5), // Thicker border
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd), // Sharper inputs
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2), // Thicker focus
      ),
    ),
    dividerColor: AppColors.divider,
    tabBarTheme: TabBarThemeData(
      labelColor: Colors.white,
      unselectedLabelColor: AppColors.textSecondary,
      indicatorSize: TabBarIndicatorSize.tab,
      indicator: BoxDecoration(
        color: AppColors.primaryBlue,
        borderRadius: BorderRadius.circular(8), // Sharper tabs
      ),
      labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, letterSpacing: 0.2), // Reduced from w900
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), // Reduced from w700
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      height: 70,
      elevation: 0,
      indicatorColor: AppColors.primaryBlue, // Thick solid selection
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: Colors.white, size: 28);
        }
        return const IconThemeData(color: AppColors.textSecondary, size: 24);
      }),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold);
        }
        return const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600);
      }),
    ),
  );

  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryLight, // Brighter blue for dark mode
      onPrimary: Colors.white,
      secondary: AppColors.primaryLight,
      surface: const Color(0xFF161F3D), // Deep Navy Card
      error: AppColors.errorBorder,
    ),
    scaffoldBackgroundColor: AppColors.darkNavy, // 0xFF0A0F24
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.darkNavy,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      scrolledUnderElevation: 0,
      titleTextStyle: const TextStyle(
        fontFamily: 'Nunito',
        fontSize: 22,
        fontWeight: FontWeight.w800,
        color: Colors.white,
        letterSpacing: -0.5,
      ),
      shape: const Border(
        bottom: BorderSide(color: Color(0xFF161F3D), width: 1),
      ),
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF161F3D),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        side: const BorderSide(color: Color(0xFF2B3A67), width: 1.5), // Tinted border
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF161F3D),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        borderSide: const BorderSide(color: Color(0xFF2B3A67)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        borderSide: const BorderSide(color: Color(0xFF2B3A67)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        borderSide: const BorderSide(color: AppColors.primaryLight, width: 2),
      ),
      hintStyle: const TextStyle(color: Colors.white38),
    ),
    dividerColor: const Color(0xFF2B3A67), // Slightly brighter tinted divider
    tabBarTheme: TabBarThemeData(
      labelColor: Colors.white,
      unselectedLabelColor: Colors.white54,
      indicatorSize: TabBarIndicatorSize.tab,
      indicator: BoxDecoration(
        color: AppColors.primaryBlue,
        borderRadius: BorderRadius.circular(12),
      ),
      labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.2),
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.darkNavy,
      height: 70,
      elevation: 0,
      indicatorColor: AppColors.primaryBlue,
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: Colors.white, size: 28);
        }
        return const IconThemeData(color: Colors.white54, size: 24);
      }),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return AppTextStyles.captionSmall.copyWith(
            color: AppColors.primaryLight,
            fontWeight: FontWeight.w800,
            fontSize: 11,
          );
        }
        return AppTextStyles.captionSmall.copyWith(
          color: Colors.white54,
          fontWeight: FontWeight.w600,
          fontSize: 11,
        );
      }),
    ),
    // Override ALL text to white in dark mode (since textPrimary is now dark navy)
    textTheme: const TextTheme(
      displayLarge: TextStyle(color: Colors.white),
      displayMedium: TextStyle(color: Colors.white),
      displaySmall: TextStyle(color: Colors.white),
      headlineLarge: TextStyle(color: Colors.white),
      headlineMedium: TextStyle(color: Colors.white),
      headlineSmall: TextStyle(color: Colors.white),
      titleLarge: TextStyle(color: Colors.white),
      titleMedium: TextStyle(color: Colors.white),
      titleSmall: TextStyle(color: Colors.white),
      bodyLarge: TextStyle(color: Colors.white),
      bodyMedium: TextStyle(color: Colors.white70),
      bodySmall: TextStyle(color: Colors.white60),
      labelLarge: TextStyle(color: Colors.white),
      labelMedium: TextStyle(color: Colors.white70),
      labelSmall: TextStyle(color: Colors.white54),
    ),
  );
}
