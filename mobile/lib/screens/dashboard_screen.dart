import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/exam.dart';
import 'login_screen.dart';
import 'chat_screen.dart';
import 'exam_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Exam> _exams = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchExams();
  }

  Future<void> _fetchExams() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    try {
      final response = await apiService.get('/exams');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _exams = data.map((e) => Exam.fromJson(e)).toList();
        });
      }
    } catch (e) {
      debugPrint('Error fetching exams: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _handleLogout() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    await apiService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Exams', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchExams,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _exams.length,
                itemBuilder: (context, index) {
                  final theme = Theme.of(context);
                  final isDark = theme.brightness == Brightness.dark;
                  
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(
                        exam.title,
                        style: TextStyle(
                          fontSize: 18, 
                          fontWeight: FontWeight.bold, 
                          color: theme.textTheme.bodyLarge?.color
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Text(
                            exam.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: isDark ? Colors.white60 : Colors.slate.shade500),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              if (exam.isPremium)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF78350F).withOpacity(0.2) : Colors.amber.shade50,
                                    border: Border.all(color: isDark ? const Color(0xFF78350F) : Colors.amber.shade200),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'PREMIUM',
                                    style: TextStyle(
                                      color: isDark ? Colors.amberAccent : Colors.amber.shade700, 
                                      fontSize: 10, 
                                      fontWeight: FontWeight.bold
                                    ),
                                  ),
                                )
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF064E3B).withOpacity(0.2) : Colors.emerald.shade50,
                                    border: Border.all(color: isDark ? const Color(0xFF059669) : Colors.emerald.shade200),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'FREE',
                                    style: TextStyle(
                                      color: isDark ? Colors.emeraldAccent : Colors.emerald.shade700, 
                                      fontSize: 10, 
                                      fontWeight: FontWeight.bold
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      trailing: Icon(
                        Icons.chevron_right, 
                        color: isDark ? Colors.white38 : Colors.slate.shade400
                      ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ExamDetailScreen(exam: exam),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
    );
  }
}
