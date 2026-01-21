import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:local_auth/local_auth.dart';
import 'dart:convert';

/// Offline storage service using SQLite

class OfflineStorageService {
  static final OfflineStorageService _instance =
      OfflineStorageService._internal();
  factory OfflineStorageService() => _instance;
  OfflineStorageService._internal();

  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'erankup.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        // Exams table
        await db.execute('''
          CREATE TABLE exams (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            isPremium INTEGER NOT NULL,
            totalQuestions INTEGER,
            duration INTEGER,
            data TEXT NOT NULL,
            cachedAt INTEGER NOT NULL
          )
        ''');

        // Attempts table
        await db.execute('''
          CREATE TABLE attempts (
            id TEXT PRIMARY KEY,
            examId TEXT NOT NULL,
            score INTEGER NOT NULL,
            data TEXT NOT NULL,
            completedAt INTEGER NOT NULL
          )
        ''');

        // User stats table
        await db.execute('''
          CREATE TABLE user_stats (
            id INTEGER PRIMARY KEY,
            totalTests INTEGER,
            averageScore REAL,
            bestScore INTEGER,
            rank INTEGER,
            streak INTEGER,
            updatedAt INTEGER NOT NULL
          )
        ''');
      },
    );
  }

  /// Cache exams for offline access
  Future<void> cacheExams(List<Map<String, dynamic>> exams) async {
    final db = await database;
    final batch = db.batch();

    for (var exam in exams) {
      batch.insert(
        'exams',
        {
          'id': exam['id'],
          'title': exam['title'],
          'description': exam['description'] ?? '',
          'isPremium': exam['isPremium'] ? 1 : 0,
          'totalQuestions': exam['totalQuestions'] ?? 0,
          'duration': exam['duration'] ?? 0,
          'data': jsonEncode(exam),
          'cachedAt': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
  }

  /// Get cached exams
  Future<List<Map<String, dynamic>>> getCachedExams() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('exams');

    return maps.map((map) {
      return jsonDecode(map['data'] as String) as Map<String, dynamic>;
    }).toList();
  }

  /// Cache user stats
  Future<void> cacheUserStats(Map<String, dynamic> stats) async {
    final db = await database;
    await db.insert(
      'user_stats',
      {
        'id': 1,
        'totalTests': stats['totalTests'] ?? 0,
        'averageScore': stats['averageScore'] ?? 0.0,
        'bestScore': stats['bestScore'] ?? 0,
        'rank': stats['rank'] ?? 0,
        'streak': stats['streak'] ?? 0,
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Get cached user stats
  Future<Map<String, dynamic>?> getCachedUserStats() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'user_stats',
      where: 'id = ?',
      whereArgs: [1],
    );

    if (maps.isEmpty) return null;
    return maps.first;
  }

  /// Clear all cached data
  Future<void> clearCache() async {
    final db = await database;
    await db.delete('exams');
    await db.delete('attempts');
    await db.delete('user_stats');
  }
}

/// Connectivity service to check network status

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();

  /// Check if device is online
  Future<bool> isOnline() async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }

  /// Listen to connectivity changes
  Stream<bool> get onConnectivityChanged {
    return _connectivity.onConnectivityChanged.map((result) {
      return result != ConnectivityResult.none;
    });
  }

  /// Get connectivity status
  Future<String> getConnectionType() async {
    final result = await _connectivity.checkConnectivity();
    switch (result) {
      case ConnectivityResult.wifi:
        return 'WiFi';
      case ConnectivityResult.mobile:
        return 'Mobile Data';
      case ConnectivityResult.ethernet:
        return 'Ethernet';
      default:
        return 'Offline';
    }
  }
}

/// Biometric authentication service

class BiometricAuthService {
  static final BiometricAuthService _instance =
      BiometricAuthService._internal();
  factory BiometricAuthService() => _instance;
  BiometricAuthService._internal();

  final LocalAuthentication _auth = LocalAuthentication();

  /// Check if biometrics are available
  Future<bool> canCheckBiometrics() async {
    try {
      return await _auth.canCheckBiometrics;
    } catch (e) {
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      return [];
    }
  }

  /// Authenticate with biometrics
  Future<bool> authenticate({
    String reason = 'Authenticate to access eRankUp',
  }) async {
    try {
      final canCheck = await canCheckBiometrics();
      if (!canCheck) return false;

      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  /// Check if device supports fingerprint
  Future<bool> hasFingerprint() async {
    final biometrics = await getAvailableBiometrics();
    return biometrics.contains(BiometricType.fingerprint);
  }

  /// Check if device supports face recognition
  Future<bool> hasFaceRecognition() async {
    final biometrics = await getAvailableBiometrics();
    return biometrics.contains(BiometricType.face);
  }

  /// Get biometric type name for display
  Future<String> getBiometricTypeName() async {
    final biometrics = await getAvailableBiometrics();
    
    if (biometrics.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (biometrics.contains(BiometricType.fingerprint)) {
      return 'Fingerprint';
    } else if (biometrics.contains(BiometricType.iris)) {
      return 'Iris';
    }
    
    return 'Biometric';
  }
}

/// Offline-first data service that combines API and local storage

class OfflineFirstService {
  final OfflineStorageService _storage = OfflineStorageService();
  final ConnectivityService _connectivity = ConnectivityService();

  /// Get exams with offline fallback
  Future<List<Map<String, dynamic>>> getExams(
    Future<List<Map<String, dynamic>>> Function() fetchFromApi,
  ) async {
    final isOnline = await _connectivity.isOnline();

    if (isOnline) {
      try {
        // Try to fetch from API
        final exams = await fetchFromApi();
        // Cache for offline use
        await _storage.cacheExams(exams);
        return exams;
      } catch (e) {
        // If API fails, fall back to cache
        return await _storage.getCachedExams();
      }
    } else {
      // Offline, use cache
      return await _storage.getCachedExams();
    }
  }

  /// Get user stats with offline fallback
  Future<Map<String, dynamic>?> getUserStats(
    Future<Map<String, dynamic>> Function() fetchFromApi,
  ) async {
    final isOnline = await _connectivity.isOnline();

    if (isOnline) {
      try {
        final stats = await fetchFromApi();
        await _storage.cacheUserStats(stats);
        return stats;
      } catch (e) {
        return await _storage.getCachedUserStats();
      }
    } else {
      return await _storage.getCachedUserStats();
    }
  }
}
