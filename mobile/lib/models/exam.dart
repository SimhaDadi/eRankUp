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
  final String? category;
  final String? category;
  final int? totalModels;
  final bool isPublished;

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
    this.totalModels,
    this.category,
    this.isPublished = false,
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
      category: json['category'],
      isPublished: json['isPublished'] ?? true, // Default to true if missing for backward compatibility, or false if strict? Let's check backend. Backend default is false for new drafts. But old data might be missing it. Let's assume false for safety, or true if we want to show existing? 
      // User wants strict staging. So default should be false if undefined? 
      // Actually backend sends it. 
      // Let's safe default to false to hide drafts.
    );
  }
}
