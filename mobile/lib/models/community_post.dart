class CommunityPost {
  final String id;
  final String content;
  final String userName;
  final String category;
  final String? imageUrl;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;
  final DateTime createdAt;

  CommunityPost({
    required this.id,
    required this.content,
    required this.userName,
    required this.category,
    this.imageUrl,
    required this.likesCount,
    required this.commentsCount,
    required this.isLiked,
    required this.createdAt,
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    return CommunityPost(
      id: json['id'],
      content: json['content'],
      userName: json['user']['fullName'] ?? 'Anonymous',
      category: json['category'],
      imageUrl: json['imageUrl'],
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
