import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../models/chapter.dart';
import 'test_engine_screen.dart';

class PracticeModeScreen extends StatefulWidget {
  const PracticeModeScreen({super.key});

  @override
  State<PracticeModeScreen> createState() => _PracticeModeScreenState();
}

class _PracticeModeScreenState extends State<PracticeModeScreen> {
  List<dynamic> _hierarchy = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchHierarchy();
  }

  Future<void> _fetchHierarchy() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    final apiService = Provider.of<ApiService>(context, listen: false);

    try {
      final response = await apiService.get('/exams/hierarchy');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _hierarchy = jsonDecode(response.body);
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = "Failed to load practice modules.";
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = "Connection failed. Please try again.";
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _startChapterPractice(String chapterId, String title) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final response = await apiService.post('/test-session/start/chapter', {
        'chapterId': chapterId
      });

      // Close loading dialog
      if (mounted) Navigator.pop(context);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (mounted) {
           // The response from startChapterSession should act like a test session.
           // However based on controller, it calls sessionService.startChapterSession.
           // We expect it to return a session object or similar structure to what TestEngineScreen expects.
           // TestEngineScreen expects a TestModel.
           // Let's create a TestModel from the response.
           
           // Backend Implementation check:
           // test-session.service.ts -> startChapterSession usually creates a TestSession and returns it.
           // TestModel.fromJson parses the exam/model structure.
           // Ideally we should pass a TestModel.
           // If the response is a Session, it might need mapping.
           
           // For now, let's assume the response structure is compatible or we map meaningful fields.
           // If the response contains 'questions', we can construct a virtual TestModel.
           
           List<dynamic> questions = data['questions'] ?? [];
           
           final virtualModel = TestModel(
              id: data['id'] ?? data['sessionId'] ?? 'practice-$chapterId',
              title: title,
              totalQuestions: questions.length,
              duration: 0, // Practice usually unlimited or specific
              // We might need to handle practice mode specifically in TestEngineScreen if it differs from Exam
            );

            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TestEngineScreen(model: virtualModel),
              ),
            );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to start practice: ${response.body}')),
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.pop(context); // Close dialog
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Topic-wise Practice'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _fetchHierarchy, child: const Text('Retry')),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(AppSpacing.screenPadding),
                  itemCount: _hierarchy.length,
                  itemBuilder: (context, index) {
                    final subject = _hierarchy[index];
                    return _buildSubjectCard(subject);
                  },
                ),
    );
  }

  Widget _buildSubjectCard(dynamic subject) {
    final title = subject['title'] ?? subject['name'] ?? 'Subject';
    final chapters = subject['chapters'] as List? ?? [];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: ExpansionTile(
        title: Text(
          title, 
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryBlue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.book, color: AppColors.primaryBlue),
        ),
        subtitle: Text('${chapters.length} Modules'),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: chapters.map<Widget>((chapter) {
          return _buildChapterItem(chapter);
        }).toList(),
      ),
    );
  }

  Widget _buildChapterItem(dynamic chapter) {
    final title = chapter['title'] ?? chapter['name'] ?? 'Chapter';
    final id = chapter['id'];

    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark 
            ? Colors.black26 
            : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: ListTile(
        title: Text(title, style: const TextStyle(fontSize: 14)),
        trailing: ElevatedButton(
          onPressed: () => _startChapterPractice(id, title),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryCyan,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Practice'),
        ),
      ),
    );
  }
}
