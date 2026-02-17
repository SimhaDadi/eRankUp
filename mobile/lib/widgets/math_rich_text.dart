import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

class MathRichText extends StatelessWidget {
  final String text;
  final TextStyle style;

  const MathRichText({super.key, required this.text, required this.style});

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) return const SizedBox.shrink();

    final List<Widget> blocks = [];
    final lines = text.split('\n');

    for (var line in lines) {
      if (line.trim().isEmpty) {
        blocks.add(const SizedBox(height: 8));
        continue;
      }

      if (line.trim().startsWith('###')) {
        blocks.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 4),
          child: _renderFormattedLine(
            line.replaceFirst('###', '').trim(),
            style.copyWith(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.blueAccent),
          ),
        ));
      } else if (line.trim().startsWith('##')) {
        blocks.add(Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 6),
          child: _renderFormattedLine(
            line.replaceFirst('##', '').trim(),
            style.copyWith(fontSize: 18, fontWeight: FontWeight.w900),
          ),
        ));
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        blocks.add(Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('• ', style: style.copyWith(fontWeight: FontWeight.bold)),
              Expanded(child: _renderFormattedLine(line.trim().substring(2), style)),
            ],
          ),
        ));
      } else {
        blocks.add(Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: _renderFormattedLine(line, style),
        ));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: blocks,
    );
  }

  Widget _renderFormattedLine(String line, TextStyle baseStyle) {
    // Regex to capture bold (**...**), LaTeX ($...$), and anything else
    final regex = RegExp(r'(\*\*.*?\*\*|\$.*?\$|[^$*]+)');
    final matches = regex.allMatches(line);
    final spans = <InlineSpan>[];

    for (var match in matches) {
      final textChunk = match.group(0)!;
      if (textChunk.startsWith('**') && textChunk.endsWith('**') && textChunk.length > 4) {
        spans.add(TextSpan(
          text: textChunk.substring(2, textChunk.length - 2),
          style: baseStyle.copyWith(fontWeight: FontWeight.bold),
        ));
      } else if (textChunk.startsWith('\$') && textChunk.endsWith('\$') && textChunk.length > 2) {
        final formula = textChunk.substring(1, textChunk.length - 1);
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Math.tex(
              formula,
              mathStyle: MathStyle.text,
              textStyle: baseStyle,
              onErrorFallback: (err) => Text('\$$formula\$', style: baseStyle.copyWith(color: Colors.red)),
            ),
          ),
        ));
      } else {
        spans.add(TextSpan(text: textChunk, style: baseStyle));
      }
    }

    if (spans.isEmpty) {
      return Text(line, style: baseStyle);
    }

    return RichText(
      text: TextSpan(children: spans),
    );
  }
}
