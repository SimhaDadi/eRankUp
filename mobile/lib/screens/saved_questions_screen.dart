import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/math_rich_text.dart';

class SavedQuestionsScreen extends StatefulWidget {
  const SavedQuestionsScreen({super.key});

  @override
  State<SavedQuestionsScreen> createState() => _SavedQuestionsScreenState();
}

class _SavedQuestionsScreenState extends State<SavedQuestionsScreen> {
  List<dynamic>? _savedQuestions;
  bool _isLoading = true;
  final Set<String> _generatingIds = {};
  final Set<String> _failedIds = {};

  @override
  void initState() {
    super.initState();
    _fetchSavedQuestions();
  }

  Future<void> _fetchSavedQuestions() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/users/saved-questions');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          // Extract the nested question objects from SavedQuestion list
          _savedQuestions = data.map((item) => item['question']).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching saved questions: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _unsaveQuestion(String questionId) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      // Using the unified toggle endpoint
      await apiService.post('/users/saved-questions/$questionId/toggle', {});
      setState(() {
        _savedQuestions?.removeWhere((q) => q['id'] == questionId);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Question removed from saved')),
        );
      }
    } catch (e) {
      debugPrint('Error unsaving question: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Questions'),
        elevation: 0,
      ),
      body: _savedQuestions == null || _savedQuestions!.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_border, size: 80, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text(
                    'No saved questions yet',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Save questions during tests to review later',
                    style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.grey.shade500),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _savedQuestions!.length,
              itemBuilder: (context, index) {
                final question = _savedQuestions![index];
                return _buildQuestionCard(question);
              },
            ),
    );
  }

  Widget _buildQuestionCard(Map<String, dynamic> question) {
    final content = question['content'] ?? 'No content';
    final topic = question['topic'] ?? 'General';
    final difficulty = question['difficulty'] ?? 'Medium';
    final questionId = question['id'];

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
        boxShadow: isDark ? [] : [
          BoxShadow(
            color: Colors.grey.shade100,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with topic and difficulty
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  topic,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFF60A5FA) : Colors.blue.shade700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getDifficultyColor(difficulty).withOpacity(isDark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  difficulty,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isDark ? _getDarkDifficultyColor(difficulty) : _getDifficultyColor(difficulty),
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.bookmark, color: Colors.amber),
                onPressed: () => _unsaveQuestion(questionId),
                tooltip: 'Remove from saved',
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Question content
          MathRichText(
            text: content,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.white70 : Colors.black87,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          
          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // Navigate to question detail/practice
                  },
                  icon: const Icon(Icons.play_arrow, size: 18),
                  label: const Text('Practice'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showExplanationBottomSheet(question),
                  icon: const Icon(Icons.lightbulb_outline, size: 18),
                  label: const Text('Explanation'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _showExplanationBottomSheet(Map<String, dynamic> question) async {
    final questionId = question['id'] as String;
    String? explanation = question['explanation']?.toString();

    final isMissing = explanation == null ||
        explanation.trim().isEmpty ||
        explanation.trim() == 'No explanation provided.' ||
        explanation.trim() == 'No explanation provided' ||
        explanation.trim().length < 5;

    if (isMissing && !_generatingIds.contains(questionId) && !_failedIds.contains(questionId)) {
      setState(() => _generatingIds.add(questionId));
      final apiService = Provider.of<ApiService>(context, listen: false);
      try {
        final response = await apiService.get('/explanations/$questionId');
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          explanation = data['explanation']?.toString();
          // Update the cached question object so subsequent taps are instant
          question['explanation'] = explanation;
          setState(() => _generatingIds.remove(questionId));
        } else {
          setState(() {
            _generatingIds.remove(questionId);
            _failedIds.add(questionId);
          });
        }
      } catch (e) {
        debugPrint('Error fetching explanation: $e');
        setState(() {
          _generatingIds.remove(questionId);
          _failedIds.add(questionId);
        });
      }
    }

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;
            final isGenerating = _generatingIds.contains(questionId);
            final hasFailed = _failedIds.contains(questionId);
            final currentExplanation = question['explanation']?.toString() ?? '';

            return Container(
              height: MediaQuery.of(ctx).size.height * 0.7,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Drag handle
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      children: [
                        Icon(Icons.lightbulb_outline, color: AppColors.primaryCyan, size: 20),
                        const SizedBox(width: 10),
                        Text(
                          'Explanation',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
                  // Body
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: isGenerating
                          ? const Center(
                              child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 40),
                                child: Column(
                                  children: [
                                    CircularProgressIndicator(strokeWidth: 2),
                                    SizedBox(height: 16),
                                    Text('Generating AI explanation...', style: TextStyle(color: AppColors.primaryBlue)),
                                  ],
                                ),
                              ),
                            )
                          : hasFailed
                              ? Center(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 40),
                                    child: Column(
                                      children: [
                                        const Icon(Icons.error_outline, color: Colors.orange, size: 32),
                                        const SizedBox(height: 12),
                                        const Text('Failed to load explanation.', style: TextStyle(color: Colors.orange)),
                                        TextButton(
                                          onPressed: () {
                                            setState(() => _failedIds.remove(questionId));
                                            Navigator.pop(ctx);
                                            _showExplanationBottomSheet(question);
                                          },
                                          child: const Text('Try Again'),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              : MathRichText(
                                  text: currentExplanation.isNotEmpty ? currentExplanation : 'No explanation available.',
                                  style: TextStyle(
                                    fontSize: 14,
                                    height: 1.6,
                                    color: isDark ? Colors.white70 : Colors.black87,
                                  ),
                                ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Color _getDarkDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.greenAccent;
      case 'medium':
        return Colors.orangeAccent;
      case 'hard':
        return Colors.redAccent;
      default:
        return Colors.grey;
    }
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'hard':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
