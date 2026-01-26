class Exam {
  final String id;
  final String title;
  final String description;
  final bool isPremium;
  final double price;
  final bool hasPurchased;
  final String type;
  final int? duration;
  final int? totalQuestions;
  final String? activeSession;
  final int? totalModels;

  Exam({
    required this.id,
    required this.title,
    required this.description,
    required this.isPremium,
    required this.price,
    this.type = 'real_exam',
    this.hasPurchased = false,
    this.duration,
    this.totalQuestions,
    this.activeSession,
    this.totalModels,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    return Exam(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      isPremium: json['isPremium'] ?? false,
      price: (json['price'] ?? 0).toDouble(),
      type: json['type'] ?? 'real_exam',
      hasPurchased: json['hasPurchased'] ?? false,
      duration: json['duration'],
      totalQuestions: json['questionCount'] ?? json['totalQuestions'],
      activeSession: json['activeSession'],
      totalModels: json['totalModels'],
    );
  }
}
