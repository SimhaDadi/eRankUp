class CommunityComment {
  final String id;
  final String content;
  final String userName;
  final DateTime createdAt;

  CommunityComment({
    required this.id,
    required this.content,
    required this.userName,
    required this.createdAt,
  });

  factory CommunityComment.fromJson(Map<String, dynamic> json) {
    return CommunityComment(
      id: json['id'],
      content: json['content'],
      userName: json['user']['fullName'] ?? 'Anonymous',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
