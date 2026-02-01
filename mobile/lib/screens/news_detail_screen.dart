import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';

class NewsDetailScreen extends StatelessWidget {
  final NewsItem newsItem;

  const NewsDetailScreen({super.key, required this.newsItem});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (newsItem.imageUrl != null)
                    Image.network(
                      newsItem.imageUrl!,
                      fit: BoxFit.cover,
                    )
                  else
                    Container(color: AppColors.primaryBlue),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          isDark ? const Color(0xFF0F172A) : Colors.black.withOpacity(0.7),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              title: Text(
                newsItem.category, 
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white70)
              ),
              titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    newsItem.title,
                    style: AppTextStyles.h2.copyWith(fontSize: 24, height: 1.3),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                      const SizedBox(width: 6),
                      Text(
                        "${newsItem.publishedAt.day}/${newsItem.publishedAt.month}/${newsItem.publishedAt.year}",
                        style: const TextStyle(color: Colors.grey),
                      ),
                      if (newsItem.source != null) ...[
                        const SizedBox(width: 16),
                        const Icon(Icons.source, size: 14, color: Colors.grey),
                        const SizedBox(width: 6),
                        Text(
                          newsItem.source!,
                          style: const TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 24),
                  Html(
                    data: newsItem.content,
                    style: {
                      "body": Style(
                        fontSize: FontSize(16),
                        lineHeight: LineHeight.number(1.6),
                        color: isDark ? Colors.white70 : Colors.black87,
                        margin: Margins.zero,
                      ),
                      "p": Style(margin: Margins.only(bottom: 16)),
                      "ul": Style(margin: Margins.only(left: 16)),
                    },
                  ),
                  const SizedBox(height: 24),
                  if (newsItem.tags.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: newsItem.tags.map((tag) => Chip(
                        label: Text('#$tag'),
                        backgroundColor: isDark ? Colors.white10 : Colors.grey.shade100,
                        labelStyle: TextStyle(
                          color: isDark ? Colors.white70 : Colors.grey.shade700,
                          fontSize: 12,
                        ),
                      )).toList(),
                    ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
