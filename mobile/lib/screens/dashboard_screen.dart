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
                  final exam = _exams[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    // Uses CardTheme from main.dart (White)
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(
                        exam.title,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Text(
                            exam.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: Colors.slate.shade500),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              if (exam.isPremium)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.shade50,
                                    border: Border.all(color: Colors.amber.shade200),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'PREMIUM',
                                    style: TextStyle(color: Colors.amber.shade700, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                )
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.emerald.shade50,
                                    border: Border.all(color: Colors.emerald.shade200),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'FREE',
                                    style: TextStyle(color: Colors.emerald.shade700, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      trailing: Icon(Icons.chevron_right, color: Colors.slate.shade400),
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
