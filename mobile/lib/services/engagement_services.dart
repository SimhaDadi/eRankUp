import 'package:share_plus/share_plus.dart';
import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'api_service.dart';

/// Firebase Cloud Messaging Service for Remote Push Notifications
class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  /// Background message handler
  @pragma('vm:entry-point')
  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print("Handling a background message: ${message.messageId}");
    // Optionally trigger a local notification from background payload if needed
  }

  /// Initialize FCM
  Future<void> initialize(ApiService apiService) async {
    // Request permission (iOS/Android 13+)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted messaging permission');
    }

    // Set up background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Sync token with backend
    String? token = await _fcm.getToken();
    if (token != null) {
      print("FCM Token: $token");
      await apiService.updateFcmToken(token);
    }

    // Listen for token refreshes
    _fcm.onTokenRefresh.listen((newToken) async {
      print("FCM Token Refreshed: $newToken");
      await apiService.updateFcmToken(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      if (message.notification != null) {
        NotificationService().notifyNewContent(
          title: message.notification!.title ?? 'eRankUp',
          message: message.notification!.body ?? '',
        );
      }
    });

    // Handle notification opening the app from background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('A new onMessageOpenedApp event was published!');
      // Handle navigation if payload contains specific routes
    });
  }
}


/// Social sharing service for sharing results and achievements

class SocialSharingService {
  /// Share test results
  static Future<void> shareResult({
    required int score,
    required String examTitle,
    required int rank,
  }) async {
    final text = '''
🎯 I scored $score% in $examTitle on eRankUp!
🏆 Global Rank: #$rank

Join me and start practicing:
https://erankup.com
''';

    await Share.share(
      text,
      subject: 'My eRankUp Result - $examTitle',
    );
  }

  /// Share achievement unlock
  static Future<void> shareAchievement({
    required String achievementTitle,
    required int totalXP,
  }) async {
    final text = '''
🏅 Achievement Unlocked: $achievementTitle
⭐ Total XP: $totalXP

Challenge yourself on eRankUp:
https://erankup.com
''';

    await Share.share(
      text,
      subject: 'Achievement Unlocked - $achievementTitle',
    );
  }

  /// Share streak milestone
  static Future<void> shareStreak({
    required int streakDays,
  }) async {
    final text = '''
🔥 $streakDays Day Streak on eRankUp!
💪 Consistency is key to success!

Start your learning journey:
https://erankup.com
''';

    await Share.share(
      text,
      subject: '$streakDays Day Streak!',
    );
  }

  /// Share app with friends
  static Future<void> shareApp() async {
    const text = '''
📚 Check out eRankUp - AI-Powered Exam Preparation!

✅ Mock Tests
✅ Live Tests
✅ Performance Analytics
✅ AI Insights

Download now:
https://erankup.com
''';

    await Share.share(
      text,
      subject: 'Try eRankUp!',
    );
  }
}

/// Notification service for reminders and alerts

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  /// Initialize notifications
  Future<void> initialize() async {
    await AwesomeNotifications().initialize(
      null, // Use default app icon
      [
        NotificationChannel(
          channelKey: 'study_reminders',
          channelName: 'Study Reminders',
          channelDescription: 'Daily study reminder notifications',
          defaultColor: const Color(0xFF2563EB),
          ledColor: Colors.white,
          importance: NotificationImportance.High,
        ),
        NotificationChannel(
          channelKey: 'live_tests',
          channelName: 'Live Tests',
          channelDescription: 'Live test start notifications',
          defaultColor: const Color(0xFFEF4444),
          ledColor: Colors.white,
          importance: NotificationImportance.Max,
          playSound: true,
        ),
        NotificationChannel(
          channelKey: 'achievements',
          channelName: 'Achievements',
          channelDescription: 'Achievement unlock notifications',
          defaultColor: const Color(0xFFF59E0B),
          ledColor: Colors.white,
          importance: NotificationImportance.High,
        ),
        NotificationChannel(
          channelKey: 'general',
          channelName: 'General',
          channelDescription: 'General app notifications',
          defaultColor: const Color(0xFF2563EB),
          ledColor: Colors.white,
          importance: NotificationImportance.Default,
        ),
      ],
    );

    // Request permissions
    await AwesomeNotifications().requestPermissionToSendNotifications();
  }

  /// Schedule daily study reminder
  Future<void> scheduleDailyReminder({
    int id = 1,
    required int hour,
    required int minute,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: id,
        channelKey: 'study_reminders',
        title: '📚 Time to practice!',
        body: 'Keep your streak going! Complete today\'s quiz.',
        notificationLayout: NotificationLayout.Default,
        category: NotificationCategory.Reminder,
      ),
      schedule: NotificationCalendar(
        hour: hour,
        minute: minute,
        second: 0,
        repeats: true,
      ),
    );
  }

  /// Cancel daily reminder by ID
  Future<void> cancelDailyReminder(int id) async {
    await AwesomeNotifications().cancel(id);
  }

  /// Cancel all daily reminders in the channel
  Future<void> cancelAllStudyReminders() async {
    // Currently AwesomeNotifications cancelByChannel is not available in some versions,
    // we'll handle this by clearing our list in SettingsScreen and calling cancel(id)
  }

  /// Notify about live test
  Future<void> notifyLiveTest({
    required String examTitle,
    required DateTime startTime,
  }) async {
    // Notify 30 minutes before
    final notifyTime = startTime.subtract(const Duration(minutes: 30));

    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: 'live_tests',
        title: '🔴 Live Test Starting Soon!',
        body: '$examTitle starts in 30 minutes',
        category: NotificationCategory.Reminder,
        wakeUpScreen: true,
      ),
      schedule: NotificationCalendar.fromDate(date: notifyTime),
    );
  }

  /// Notify achievement unlocked
  Future<void> notifyAchievementUnlocked({
    required String achievementTitle,
    required int points,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: 'achievements',
        title: '🏅 Achievement Unlocked!',
        body: '$achievementTitle (+$points XP)',
        category: NotificationCategory.Status,
      ),
    );
  }

  /// Notify streak milestone
  Future<void> notifyStreakMilestone({
    required int streakDays,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: 'general',
        title: '🔥 $streakDays Day Streak!',
        body: 'Amazing consistency! Keep it up!',
        category: NotificationCategory.Status,
      ),
    );
  }

  /// Notify new content available
  Future<void> notifyNewContent({
    required String title,
    required String message,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: 'general',
        title: title,
        body: message,
        category: NotificationCategory.Message,
      ),
    );
  }

  /// Check if notifications are allowed
  Future<bool> areNotificationsAllowed() async {
    return await AwesomeNotifications().isNotificationAllowed();
  }

  /// Request notification permissions
  Future<bool> requestPermissions() async {
    return await AwesomeNotifications().requestPermissionToSendNotifications();
  }
}
