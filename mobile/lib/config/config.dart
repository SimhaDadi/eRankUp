class Config {
  // Environment: 'dev', 'staging', 'prod'
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'dev');

  // API Base URLs for different environments
  static const Map<String, String> _apiBaseUrls = {
    'dev': 'http://192.168.1.4:3001',     // Local Machine IP (Auto-updated)
    'mdns': 'http://DADI.local:3001',    // Fallback: Works on some networks without IP changes
    // 'dev': 'http://127.0.0.1:3001',       // Use with 'adb reverse tcp:3001 tcp:3001'
    // 'dev': 'http://10.0.2.2:3001',        // Android Emulator
    'staging': 'https://staging-api.erankup.com',
    'prod': 'https://api.erankup.com',
  };

  // Get current API base URL
  static String get apiBaseUrl => _apiBaseUrls[environment] ?? _apiBaseUrls['dev']!;
  static String get aiChatSocketUrl => apiBaseUrl.replaceFirst('http', 'ws');

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
