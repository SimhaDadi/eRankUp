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
  final DateTime? scheduledAt;

  TestModel({
    required this.id,
    required this.title,
    required this.totalQuestions,
    this.scheduledAt,
  });

  factory TestModel.fromJson(Map<String, dynamic> json) {
    return TestModel(
      id: json['id'],
      title: json['title'],
      totalQuestions: json['totalQuestions'] ?? 0,
      scheduledAt: json['scheduledAt'] != null 
          ? DateTime.parse(json['scheduledAt']) 
          : null,
    );
  }

  bool get isLive {
    if (scheduledAt == null) return true;
    return DateTime.now().isAfter(scheduledAt!);
  }
}
