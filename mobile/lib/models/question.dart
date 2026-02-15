class Question {
  final String id;
  final String content;
  final String? imageUrl;
  final List<Option> options;

  Question({required this.id, required this.content, this.imageUrl, required this.options});

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'],
      content: json['content'],
      imageUrl: json['imageUrl'],
      options: (json['options'] as List)
          .map((o) => Option.fromJson(o))
          .toList(),
    );
  }
}

class Option {
  final String id;
  final String text;

  Option({required this.id, required this.text});

  factory Option.fromJson(Map<String, dynamic> json) {
    return Option(
      id: json['id'],
      text: json['text'],
    );
  }
}
