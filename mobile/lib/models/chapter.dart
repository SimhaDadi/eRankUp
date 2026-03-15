import 'exam.dart';

class Chapter {
  final String id;
  final String title;
  final List<TestModel> models;

  Chapter({required this.id, required this.title, required this.models});

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'],
      title: json['title'],
      models: (json['models'] as List? ?? [])
          .map((m) => TestModel.fromJson(m))
          .toList(),
    );
  }
}

class TestModel {
  final String id;
  final String title;
  final int totalQuestions;
  final int duration;
  final DateTime? scheduledAt;
  
  // Marking Scheme
  final double positiveMarks;
  final double negativeMarks;
  final int totalMarks;
  
  // Difficulty & Configuration
  final String difficulty;
  final bool allowCalculator;
  final bool allowReview;
  final bool allowSkip;
  final bool showResultsImmediately;
  final String? customInstructions;
  final int warningTimeMinutes;
  final Map<String, dynamic>? metadata;

  TestModel({
    required this.id,
    required this.title,
    required this.totalQuestions,
    this.duration = 60,
    this.scheduledAt,
    this.positiveMarks = 1.0,
    this.negativeMarks = 0.0,
    this.totalMarks = 0,
    this.difficulty = 'medium',
    this.allowCalculator = false,
    this.allowReview = true,
    this.allowSkip = true,
    this.showResultsImmediately = false,
    this.customInstructions,
    this.warningTimeMinutes = 5,
    this.metadata,
  });

  factory TestModel.fromJson(Map<String, dynamic> json) {
    final totalQuestions = json['totalQuestions'] ?? 0;
    final positiveMarks = (json['positiveMarks'] as num?)?.toDouble() ?? 1.0;
    final totalMarks = json['totalMarks'] ?? (totalQuestions * positiveMarks).toInt();
    
    return TestModel(
      id: json['id'],
      title: json['title'],
      totalQuestions: totalQuestions,
      duration: json['duration'] ?? 60,
      scheduledAt: json['scheduledAt'] != null 
          ? DateTime.parse(json['scheduledAt']) 
          : null,
      positiveMarks: positiveMarks,
      negativeMarks: (json['negativeMarks'] as num?)?.toDouble() ?? 0.0,
      totalMarks: totalMarks,
      difficulty: json['difficulty'] ?? 'medium',
      allowCalculator: json['allowCalculator'] ?? false,
      allowReview: json['allowReview'] ?? true,
      allowSkip: json['allowSkip'] ?? true,
      showResultsImmediately: json['showResultsImmediately'] ?? false,
      customInstructions: json['customInstructions'],
      warningTimeMinutes: json['warningTimeMinutes'] ?? 5,
      metadata: json['metadata'],
    );
  }

  /// Creates a virtual TestModel from an Exam object for "direct" exams
  factory TestModel.fromExam(Exam exam) {
    return TestModel(
      id: exam.id,
      title: exam.title,
      totalQuestions: exam.totalQuestions ?? 0,
      duration: exam.duration ?? 60,
      difficulty: 'medium', // Default for exams
      metadata: exam.metadata,
      // Default marking scheme if not specified in metadata
      positiveMarks: 1.0,
      negativeMarks: 0.0,
    );
  }

  bool get isLive {
    if (scheduledAt == null) return true;
    return DateTime.now().isAfter(scheduledAt!);
  }
}
