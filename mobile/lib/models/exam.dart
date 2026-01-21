class Exam {
  final String id;
  final String title;
  final String description;
  final bool isPremium;
  final double price;
  final bool hasPurchased;

  Exam({
    required this.id,
    required this.title,
    required this.description,
    required this.isPremium,
    required this.price,
    this.hasPurchased = false,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    return Exam(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      isPremium: json['isPremium'] ?? false,
      price: (json['price'] ?? 0).toDouble(),
      hasPurchased: json['hasPurchased'] ?? false,
    );
  }
}
