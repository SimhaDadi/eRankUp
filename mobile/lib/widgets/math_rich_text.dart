import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

class MathRichText extends StatelessWidget {
  final String text;
  final TextStyle style;

  const MathRichText({super.key, required this.text, required this.style});

  @override
  Widget build(BuildContext context) {
    // Regex to split text by $...$ (LaTeX blocks)
    final regex = RegExp(r'\$((?:\\\$|[^$])*)\$');
    final List<InlineSpan> children = [];
    
    int lastMatchEnd = 0;
    for (final match in regex.allMatches(text)) {
      // Add plain text before match
      if (match.start > lastMatchEnd) {
        children.add(TextSpan(
          text: text.substring(lastMatchEnd, match.start),
          style: style,
        ));
      }
      
      // Add LaTeX content
      final formula = match.group(1)!;
      children.add(WidgetSpan(
        alignment: PlaceholderAlignment.middle,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Math.tex(
            formula,
            mathStyle: MathStyle.text,
            textStyle: style,
            onErrorFallback: (err) => Text('\$$formula\$', style: style.copyWith(color: Colors.red)),
          ),
        ),
      ));
      
      lastMatchEnd = match.end;
    }
    
    // Add remaining plain text
    if (lastMatchEnd < text.length) {
      children.add(TextSpan(
        text: text.substring(lastMatchEnd),
        style: style,
      ));
    }

    if (children.isEmpty) {
       return Text(text, style: style);
    }

    return RichText(
      text: TextSpan(children: children),
    );
  }
}
