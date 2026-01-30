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
  final String? category;
  final int? totalModels;
  final bool isPublished;
  final Map<String, dynamic>? attempts;
  final Map<String, dynamic>? activeSession;

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
    this.category,
    this.isPublished = false,
    this.attempts,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    // Handle category: could be String (legacy) or Map (new relation)
    String? categoryName;
    if (json['category'] is Map) {
      categoryName = json['category']['name'];
    } else if (json['category'] is String) {
      categoryName = json['category'];
    }

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
      category: categoryName,
      isPublished: json['isPublished'] ?? true,
      attempts: json['attempts'],
    );
  }
}
