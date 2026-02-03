import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/news_item.dart';
import '../config/config.dart';
import '../theme/app_theme.dart';

class CurrentAffairsScreen extends StatefulWidget {
  const CurrentAffairsScreen({super.key});

  @override
  State<CurrentAffairsScreen> createState() => _CurrentAffairsScreenState();
}

class _CurrentAffairsScreenState extends State<CurrentAffairsScreen> {
  bool _isLoading = true;
  List<NewsItem> _news = [];
  String _selectedCategory = 'All';
  final List<String> _categories = [
    'All',
    'National',
    'International',
    'Sports',
    'Science & Tech',
    'Economy'
  ];

  @override
  void initState() {
    super.initState();
    _fetchNews();
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<void> _fetchNews() async {
    print('CurrentAffairs: Fetching news for $_selectedCategory');
    setState(() => _isLoading = true);
    try {
      String endpoint = '/news';
      if (_selectedCategory != 'All') {
        endpoint += '?category=$_selectedCategory';
      }
      
      final url = Uri.parse('${Config.apiBaseUrl}$endpoint');
      final headers = await _getHeaders();
      print('CurrentAffairs: Requesting $url');
      
      final response = await http.get(url, headers: headers);
      print('CurrentAffairs: Response ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> items = data['items'];
        print('CurrentAffairs: Parsed ${items.length} items');
        setState(() {
          _news = items.map((json) => NewsItem.fromJson(json)).toList();
          _isLoading = false;
        });
      } else {
        print('CurrentAffairs: Error ${response.body}');
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('CurrentAffairs: Exception $e');
      if (mounted) {
        setState(() => _isLoading = false);
        // Fallback for demo if API fails
        ScaffoldMessenger.of(context).showSnackBar(
           SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _onCategorySelected(String category) {
    if (_selectedCategory == category) return;
    setState(() {
      _selectedCategory = category;
    });
    _fetchNews();
  }

  void _showNewsDetail(NewsItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: ListView(
                  controller: controller,
                  padding: const EdgeInsets.all(AppSpacing.screenPadding),
                  children: [
                    if (item.imageUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          item.imageUrl!,
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      item.title,
                      style: AppTextStyles.h2,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.category,
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.primaryBlue,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Divider(height: 32),
                    Text(
                      item.content.replaceAll(RegExp(r'<[^>]*>'), ''),
                      style: AppTextStyles.bodySecondary.copyWith(
                        color: AppColors.textPrimary,
                        height: 1.5,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Current Affairs'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Column(
        children: [
          SizedBox(
            height: 50,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = category == _selectedCategory;
                return ChoiceChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (_) => _onCategorySelected(category),
                  selectedColor: AppColors.primaryBlue,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                  ),
                  backgroundColor: AppColors.cardBackground,
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _news.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.newspaper, size: 48, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text('No updates available', style: AppTextStyles.bodySecondary),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(AppSpacing.screenPadding),
                        itemCount: _news.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          final item = _news[index];
                          return ListTile(
                            onTap: () => _showNewsDetail(item),
                            tileColor: AppColors.cardBackground,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            title: Text(item.title, style: AppTextStyles.h3),
                            subtitle: Text(
                              item.summary,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            leading: item.imageUrl != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      item.imageUrl!,
                                      width: 60,
                                      height: 60,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.image),
                                    ),
                                  )
                                : null,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
