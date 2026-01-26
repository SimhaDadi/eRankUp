class Pass {
  final String id;
  final String title;
  final String description;
  final String price;
  final int durationDays;
  final List<String> features;
  final bool isPopular;

  Pass({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.durationDays,
    required this.features,
    this.isPopular = false,
  });

  factory Pass.fromJson(Map<String, dynamic> json) {
    return Pass(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      price: json['price']?.toString() ?? '0',
      durationDays: json['durationDays'] ?? 0,
      features: List<String>.from(json['features'] ?? []),
      isPopular: json['isPopular'] ?? false,
    );
  }
}
