class Config {
  // Environment: 'dev', 'staging', 'prod'
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'dev');
  static const String googleClientId = '571146736016-lt5qjp0bo9spik10f586p7mqkv8760a5.apps.googleusercontent.com';

  // API Base URLs for different environments
  static const Map<String, String> _apiBaseUrls = {
    'dev': 'http://192.168.1.5:3001',     // Uses 'adb reverse tcp:3001 tcp:3001' over USB
    'mdns': 'http://DADI.local:3001',    // Fallback: Works on some networks without IP changes
    // 'dev': 'http://127.0.0.1:3001',       // Local Machine IP
    // 'dev': 'http://10.0.2.2:3001',        // Android Emulator
    'staging': 'https://erankup.in/api',  // Staging: same server, same nginx routing
    'prod': 'https://erankup.in/api',     // Production: erankup.in -> nginx -> backend:3001
  };

  // Get current API base URL
  static String get apiBaseUrl => _apiBaseUrls[environment] ?? _apiBaseUrls['dev']!;
  static String get socketBaseUrl => apiBaseUrl.replaceFirst('/api', '');

  // App Configuration
  static const String appName = 'eRankUp';
  static const String appVersion = '1.0.0';

  // Feature Flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = false;

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 60);
  static const Duration connectionTimeout = Duration(seconds: 15);
}
