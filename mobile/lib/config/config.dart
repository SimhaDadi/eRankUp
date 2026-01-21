class Config {
  // Environment: 'dev', 'staging', 'prod'
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'dev');

  // API Base URLs for different environments
  static const Map<String, String> _apiBaseUrls = {
    'dev': 'http://10.0.2.2:3001',        // Android Emulator
    // 'dev': 'http://localhost:3001',     // iOS Simulator / Desktop
    'staging': 'https://staging-api.erankup.com',
    'prod': 'https://api.erankup.com',
  };

  // Get current API base URL
  static String get apiBaseUrl => _apiBaseUrls[environment] ?? _apiBaseUrls['dev']!;

  // App Configuration
  static const String appName = 'eRankUp';
  static const String appVersion = '1.0.0';

  // Feature Flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = false;

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration connectionTimeout = Duration(seconds: 15);
}
