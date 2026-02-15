class NewsItem {
  final String id;
  final String title;
  final String summary;
  final String content;
  final String category;
  final String? imageUrl;
  final String? source;
  final DateTime publishedAt;
  final List<String> tags;

  NewsItem({
    required this.id,
    required this.title,
    required this.summary,
    required this.content,
    required this.category,
    this.imageUrl,
    this.source,
    required this.publishedAt,
    required this.tags,
  });

  factory NewsItem.fromJson(Map<String, dynamic> json) {
    return NewsItem(
      id: json['id'],
      title: json['title'],
      summary: json['summary'],
      content: json['content'],
      category: json['category'],
      imageUrl: json['imageUrl'],
      source: json['source'],
      publishedAt: DateTime.parse(json['publishedAt']),
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}
