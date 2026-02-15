import 'package:flutter/material.dart';

/// App-wide design constants for colors, typography, and spacing
/// Ensures consistency and accessibility across all screens

class AppColors {
  // Premium Palette (Deep "Thick" Institutional Colors)
  static const primaryBlue = Color(0xFF1E40AF); // Deeper Royal Blue (Blue 800)
  static const primaryLight = Color(0xFF3B82F6); // Vibrant Blue (Blue 500)
  static const primaryDark = Color(0xFF1E3A8A); // Deep Navy (Blue 900)
  
  static const primaryCyan = Color(0xFF0369A1); // Saturated Cyan (Sky 700)
  static const primaryGold = Color(0xFFD97706); // Rich Amber (Amber 600)
  
  static const darkNavy = Color(0xFF0F172A); // Slate 900
  
  // Neutrals 
  static const textPrimary = Color(0xFF0F172A);    // Darker for higher contrast
  static const textSecondary = Color(0xFF475569);  // Slate 600
  static const textTertiary = Color(0xFF64748B);   // Slate 500
  static const textDisabled = Color(0xFF94A3B8);   // Slate 400
  
  // Backgrounds
  static const bgPrimary = Color(0xFFFFFFFF);      // Pure White
  static const bgSecondary = Color(0xFFF1F5F9);    // Slate 100
  static const bgTertiary = Color(0xFFE2E8F0);     // Slate 200
  static const divider = Color(0xFFE2E8F0);        
  static const cardBackground = bgPrimary;         
  
  // Success
  static const successBg = Color(0xFFDCFCE7);      
  static const successText = Color(0xFF15803D);    
  static const successBorder = Color(0xFF4ADE80);  // Saturated
  static const successDark = Color(0xFF059669);    
  
  // Warning
  static const warningBg = Color(0xFFFEF3C7);      
  static const warningText = Color(0xFF92400E);    
  static const warningBorder = Color(0xFFFBBF24);  
  static const warningDark = Color(0xFFB45309);    
  
  // Error
  static const errorBg = Color(0xFFFEE2E2);        
  static const errorText = Color(0xFF991B1B);      
  static const errorBorder = Color(0xFFF87171);    
  static const errorDark = Color(0xFFB91C1C);      

  // Info
  static const infoBg = Color(0xFFE0F2FE);         
  static const infoText = Color(0xFF075985);       
  static const infoBorder = Color(0xFF38BDF8);     
  
  // Custom Gradients (More vibrant, saturated)
  static const heroGradient = LinearGradient(
    colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)], 
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const goldGradient = LinearGradient(
    colors: [Color(0xFFD97706), Color(0xFFB45309)], 
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const liveGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E40AF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const premiumGradient = LinearGradient(
    colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const rankGradient = LinearGradient(
    colors: [Color(0xFF6D28D9), Color(0xFF4C1D95)], // Saturated Violet
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTextStyles {
  // Headers
  // Headers - Bolder and Darker
  static const h1 = TextStyle(
    fontSize: 26, // Slightly larger
    fontWeight: FontWeight.w900, // Black weight
    height: 1.2,
    color: AppColors.textPrimary,
    letterSpacing: -0.8,
  );
  
  static const h2 = TextStyle(
    fontSize: 21,
    fontWeight: FontWeight.w900,
    height: 1.2,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );
  
  static const h3 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w800,
    height: 1.3,
    color: AppColors.textPrimary,
  );
  
  static const h4 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w800,
    height: 1.4,
    color: AppColors.textPrimary,
  );
  
  // Body Text
  static const bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600, // Slightly bolder for premium feel
    height: 1.5,
    color: AppColors.textPrimary,
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
  static const double cardPadding = 18.0;
  
  // Screen padding
  static const double screenPadding = 20.0;
  
  // Border radius - Sharper for "Institutional" look
  static const double radiusSm = 6.0;
  static const double radiusMd = 12.0; // Sharp but premium
  static const double radiusLg = 14.0; // The "Golden Ratio" for institutional cards
  static const double radiusXl = 16.0; 
  static const double radiusXxl = 24.0;
  
  // Icon sizes
  static const double iconSm = 16.0;
  static const double iconMd = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  
  // Button heights
  static const double buttonHeight = 52.0; // Slightly taller for premium feel
  static const double buttonHeightSmall = 40.0;
  static const double buttonHeightLarge = 60.0;
}

class AppShadows {
  // Multi-layered Shadows for Premium Depth
  static const small = [
    BoxShadow(
      color: Color(0x0A000000), 
      blurRadius: 10,
      offset: Offset(0, 4),
    ),
  ];
  
  static const medium = [
    BoxShadow(
      color: Color(0x141E40AF), // Tinted Blue for Institutional Feel
      blurRadius: 12,
      offset: Offset(0, 6),
    ),
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
  
  static const large = [
    BoxShadow(
      color: Color(0x1F1E40AF),
      blurRadius: 24,
      offset: Offset(0, 12),
    ),
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 12,
      offset: Offset(0, 4),
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
    appBarTheme: AppBarTheme(
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
      labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.2),
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
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
      surface: const Color(0xFF1E293B), // Slate 800
      error: AppColors.errorDark,
    ),
    scaffoldBackgroundColor: const Color(0xFF0F172A),
    cardTheme: CardThemeData(
      color: const Color(0xFF1E293B),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        side: const BorderSide(color: Color(0xFF334155), width: 1.5),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF0F172A),
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w900,
        color: Colors.white,
        letterSpacing: -0.5,
      ),
      shape: Border(
        bottom: BorderSide(color: Color(0xFF1E293B), width: 1),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF0F172A),
        indicatorColor: AppColors.primaryBlue,
        iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
                return const IconThemeData(color: Colors.white, size: 28);
            }
            return const IconThemeData(color: Colors.white54, size: 24);
        }),
    ),
  );
}
