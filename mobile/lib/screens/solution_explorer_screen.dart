import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'test_engine_screen.dart'; // For MathRichText

class SolutionExplorerScreen extends StatefulWidget {
  final String attemptId;
  const SolutionExplorerScreen({super.key, required this.attemptId});

  @override
  State<SolutionExplorerScreen> createState() => _SolutionExplorerScreenState();
}

class _SolutionExplorerScreenState extends State<SolutionExplorerScreen> {
  Map<String, dynamic>? _data;
  List<dynamic> _responses = [];
  List<dynamic> _filteredResponses = [];
  bool _isLoading = true;
  String _filter = 'all'; // all, correct, incorrect, unattempted

  @override
  void initState() {
    super.initState();
    _fetchSolutionData();
  }

  Future<void> _fetchSolutionData() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/exams/attempts/${widget.attemptId}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _data = data;
          _responses = data['responses'] ?? [];
          _applyFilter();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => _isLoading = false);
    }
  }

  void _applyFilter() {
    setState(() {
      _filteredResponses = _responses.where((resp) {
        if (_filter == 'all') return true;
        
        final isCorrect = resp['isCorrect'] ?? false;
        final isAnswered = resp['selectedOptionId'] != null;

        if (_filter == 'correct') return isCorrect;
        if (_filter == 'incorrect') return !isCorrect && isAnswered;
        if (_filter == 'unattempted') return !isAnswered;
        
        return true;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Solution Explorer'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildFilterBar(),
                const Divider(height: 1),
                Expanded(
                  child: _filteredResponses.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.all(AppSpacing.screenPadding),
                          itemCount: _filteredResponses.length,
                          itemBuilder: (context, index) {
                            return _buildSolutionCard(index + 1, _filteredResponses[index]);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      height: 60,
      color: Colors.white,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        children: [
          _buildFilterChip('All', 'all'),
          _buildFilterChip('Correct', 'correct'),
          _buildFilterChip('Incorrect', 'incorrect'),
          _buildFilterChip('Skipped', 'unattempted'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (val) {
          if (val) {
            setState(() {
              _filter = value;
              _applyFilter();
            });
          }
        },
        selectedColor: AppColors.primaryBlue.withOpacity(0.1),
        labelStyle: TextStyle(
          color: isSelected ? AppColors.primaryBlue : AppColors.textTertiary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildSolutionCard(int displayIndex, dynamic resp) {
    final question = resp['question'];
    final selectedId = resp['selectedOptionId'];
    final correctId = question['correctOptionId'];
    final isCorrect = resp['isCorrect'] ?? false;
    final options = question['options'] as List? ?? [];
    final explanation = question['explanation'];

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: AppShadows.small,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('QUESTION $displayIndex', style: AppTextStyles.overline.copyWith(color: AppColors.primaryBlue)),
                    _buildStatusBadge(selectedId == null, isCorrect),
                  ],
                ),
                const SizedBox(height: 12),
                MathRichText(
                  text: question['content'] ?? '',
                  style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          
          // Options
          ...options.map((opt) {
            final isSelected = opt['id'] == selectedId;
            final isCorrectOpt = opt['id'] == correctId;
            
            Color bgColor = Colors.transparent;
            Color borderColor = Colors.grey.shade100;
            Widget? icon;

            if (isCorrectOpt) {
              bgColor = Colors.green.shade50;
              borderColor = Colors.green.shade200;
              icon = const Icon(Icons.check_circle, color: Colors.green, size: 20);
            } else if (isSelected && !isCorrect) {
              bgColor = Colors.red.shade50;
              borderColor = Colors.red.shade200;
              icon = const Icon(Icons.cancel, color: Colors.red, size: 20);
            }

            return Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              decoration: BoxDecoration(
                color: bgColor,
                border: Border.all(color: borderColor),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                   Expanded(
                     child: MathRichText(
                       text: opt['text'] ?? '',
                       style: TextStyle(
                         color: isCorrectOpt ? Colors.green.shade900 : (isSelected ? Colors.red.shade900 : AppColors.textPrimary),
                         fontWeight: (isSelected || isCorrectOpt) ? FontWeight.bold : FontWeight.normal,
                       ),
                     ),
                   ),
                   if (icon != null) icon,
                ],
              ),
            );
          }),

          const SizedBox(height: 16),

          // Explanation
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.bgTertiary,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lightbulb_outline, size: 16, color: AppColors.primaryCyan),
                        SizedBox(width: 8),
                        Text('EXPLANATION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.black, color: AppColors.primaryCyan, letterSpacing: 1)),
                      ],
                    ),
                    TextButton.icon(
                      onPressed: () => _generateBetterExplanation(question['id']),
                      icon: const Icon(Icons.auto_awesome, size: 14),
                      label: Text(explanation == null ? 'Generate AI' : 'Ask AI', style: const TextStyle(fontSize: 10)),
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        foregroundColor: AppColors.primaryBlue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (explanation != null && explanation.toString().isNotEmpty)
                  MathRichText(
                    text: explanation,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimary),
                  )
                else
                  Text(
                    'No explanation available yet. Click "Generate AI" to create one.',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textTertiary, fontStyle: FontStyle.italic),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _generateBetterExplanation(String questionId) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/explanations/$questionId');
      Navigator.pop(context); // Close loading

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newExplanation = data['explanation'];
        
        if (mounted) {
          _showExplanationDialog(newExplanation);
          // Optionally refresh the list to show it inline
          _fetchSolutionData();
        }
      }
    } catch (e) {
      Navigator.pop(context);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _showExplanationDialog(String text) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Row(
                children: [
                   const Icon(Icons.auto_awesome, color: AppColors.primaryBlue),
                   const SizedBox(width: 12),
                   Text('AI Detailed Explanation', style: AppTextStyles.h3),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: MathRichText(text: text, style: AppTextStyles.body),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Got it'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(bool skipped, bool correct) {
    if (skipped) return _badge('SKIPPED', Colors.grey);
    if (correct) return _badge('CORRECT', Colors.green);
    return _badge('INCORRECT', Colors.red);
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.filter_list_off, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text('No questions match this filter', style: AppTextStyles.bodySmall),
        ],
      ),
    );
  }
}
