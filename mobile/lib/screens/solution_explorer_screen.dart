import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/haptic_service.dart';
import '../theme/app_theme.dart';
import '../widgets/math_rich_text.dart';
import 'ai_chat_conversation_screen.dart';

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
  Set<String> _savedQuestionIds = {};
  final Set<String> _generatingIds = {};
  final Set<String> _failedIds = {};
  // Re-attempt mode
  bool _reAttemptMode = false;
  final Map<String, String> _reAttemptSelections = {}; // questionId → picked optionId

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    await Future.wait([
      _fetchSolutionData(),
      _fetchSavedQuestionIds(),
    ]);
  }

  Future<void> _fetchSavedQuestionIds() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/users/saved-questions');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _savedQuestionIds = data.map((item) => item['questionId'].toString()).toSet();
        });
      }
    } catch (e) {
      debugPrint('Error fetching saved IDs: $e');
    }
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
      // ── Re-attempt mode bottom bar ──
      bottomNavigationBar: _isLoading ? null : SafeArea(
        child: Container(
          height: 58,
          decoration: BoxDecoration(
            color: _reAttemptMode ? const Color(0xFF0D9488) : Colors.white,
            border: const Border(top: BorderSide(color: AppColors.divider)),
            boxShadow: const [
              BoxShadow(color: Color(0x14000000), blurRadius: 12, offset: Offset(0, -4)),
            ],
          ),
          child: GestureDetector(
            onTap: () {
              HapticService.light();
              setState(() {
                _reAttemptMode = !_reAttemptMode;
                if (!_reAttemptMode) _reAttemptSelections.clear();
              });
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Re-attempt Questions',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: _reAttemptMode ? Colors.white : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 12),
                // Toggle pill
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 44,
                  height: 24,
                  decoration: BoxDecoration(
                    color: _reAttemptMode ? Colors.white.withOpacity(0.3) : AppColors.bgTertiary,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _reAttemptMode ? Colors.white.withOpacity(0.5) : AppColors.divider,
                    ),
                  ),
                  child: Stack(
                    children: [
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 200),
                        top: 3,
                        left: _reAttemptMode ? 22 : 3,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: _reAttemptMode ? Colors.white : AppColors.textSecondary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    final theme = Theme.of(context);
    return Container(
      height: 60,
      color: theme.appBarTheme.backgroundColor,
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

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade100),
        boxShadow: isDark ? [] : AppShadows.small,
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
                    Row(
                      children: [
                        _buildActionButton(
                          icon: _savedQuestionIds.contains(question['id']) 
                              ? Icons.bookmark 
                              : Icons.bookmark_border,
                          color: _savedQuestionIds.contains(question['id']) 
                              ? Colors.amber 
                              : AppColors.textTertiary,
                          onTap: () => _toggleSave(question['id']),
                          tooltip: 'Save',
                        ),
                        _buildActionButton(
                          icon: Icons.flag_outlined,
                          color: AppColors.textTertiary,
                          onTap: () => _showReportDialog(question['id'], question['content']),
                          tooltip: 'Report',
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                  MathRichText(
                    text: question['content'] ?? '',
                    style: AppTextStyles.body.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.textTheme.bodyLarge?.color ?? Colors.black87
                    ),
                  ),
              ],
            ),
          ),
          
          // Options
          ...options.map((opt) {
            final optId = opt['id'] as String;
            final isSelected = optId == selectedId;
            final isCorrectOpt = optId == correctId;

            // Re-attempt mode state
            final reAttemptPicked = _reAttemptSelections[question['id'] as String];
            final hasReAttempted = reAttemptPicked != null;
            final isReAttemptPick = optId == reAttemptPicked;

            Color bgColor = Colors.transparent;
            Color borderColor = isDark ? const Color(0xFF334155) : Colors.grey.shade100;
            Widget? icon;

            if (!_reAttemptMode) {
              // Normal read-only mode
              if (isCorrectOpt) {
                bgColor = isDark ? const Color(0xFF064E3B).withOpacity(0.3) : Colors.green.shade50;
                borderColor = isDark ? const Color(0xFF059669) : Colors.green.shade200;
                icon = Icon(Icons.check_circle, color: isDark ? Colors.greenAccent : Colors.green, size: 20);
              } else if (isSelected && !isCorrect) {
                bgColor = isDark ? const Color(0xFF7F1D1D).withOpacity(0.2) : Colors.red.shade50;
                borderColor = isDark ? const Color(0xFFDC2626) : Colors.red.shade200;
                icon = Icon(Icons.cancel, color: isDark ? Colors.redAccent : Colors.red, size: 20);
              }
            } else {
              // Re-attempt mode
              if (hasReAttempted) {
                if (isCorrectOpt) {
                  bgColor = isDark ? const Color(0xFF064E3B).withOpacity(0.3) : Colors.green.shade50;
                  borderColor = isDark ? const Color(0xFF059669) : Colors.green.shade200;
                  icon = Icon(Icons.check_circle, color: isDark ? Colors.greenAccent : Colors.green, size: 20);
                } else if (isReAttemptPick && !isCorrectOpt) {
                  bgColor = isDark ? const Color(0xFF7F1D1D).withOpacity(0.2) : Colors.red.shade50;
                  borderColor = isDark ? const Color(0xFFDC2626) : Colors.red.shade200;
                  icon = Icon(Icons.cancel, color: isDark ? Colors.redAccent : Colors.red, size: 20);
                }
              } else {
                // Interactive — not picked yet
                bgColor = const Color(0xFF0D9488).withOpacity(0.05);
                borderColor = const Color(0xFF0D9488).withOpacity(0.3);
              }
            }

            return GestureDetector(
              onTap: _reAttemptMode && !hasReAttempted
                  ? () {
                      HapticService.light();
                      setState(() => _reAttemptSelections[question['id'] as String] = optId);
                    }
                  : null,
              child: Container(
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
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MathRichText(
                            text: opt['text'] ?? '',
                            style: TextStyle(
                              color: isCorrectOpt
                                  ? (isDark ? Colors.greenAccent : Colors.green.shade900)
                                  : ((!_reAttemptMode && isSelected) || (_reAttemptMode && isReAttemptPick && !isCorrectOpt))
                                      ? (isDark ? Colors.redAccent : Colors.red.shade900)
                                      : theme.textTheme.bodyMedium?.color,
                              fontWeight: ((!_reAttemptMode && (isSelected || isCorrectOpt)) ||
                                          (_reAttemptMode && hasReAttempted && (isCorrectOpt || isReAttemptPick)))
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                          // Original answer badge in re-attempt mode
                          if (_reAttemptMode && isSelected && selectedId != null) ...[  
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.amber.shade50,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.amber.shade300),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.history_rounded, size: 10, color: Colors.amber.shade800),
                                  const SizedBox(width: 4),
                                  Text('Your original answer',
                                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.amber.shade800)),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (icon != null) icon,
                    // In re-attempt mode, show teal radio circle before pick
                    if (_reAttemptMode && !hasReAttempted)
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF0D9488), width: 2),
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),

          // ── Re-attempt status banner ──
          if (_reAttemptMode) Builder(builder: (_) {
            final qId = question['id'] as String;
            final picked = _reAttemptSelections[qId];
            Color bannerColor;
            Color borderC;
            IconData bannerIcon;
            String title;
            String subtitle;
            if (picked == null) {
              bannerColor = const Color(0xFFE6FFFA);
              borderC = const Color(0xFF0D9488);
              bannerIcon = Icons.bolt_rounded;
              title = 'Re-attempt mode: ON';
              subtitle = 'Tap an option to attempt the question';
            } else if (picked == correctId) {
              bannerColor = Colors.green.shade50;
              borderC = Colors.green.shade300;
              bannerIcon = Icons.check_circle_rounded;
              title = 'Correct! Well done.';
              subtitle = 'Check the explanation below.';
            } else {
              bannerColor = Colors.red.shade50;
              borderC = Colors.red.shade200;
              bannerIcon = Icons.cancel_rounded;
              title = 'Incorrect — see the correct answer above.';
              subtitle = 'Review the explanation below.';
            }
            return Container(
              margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: bannerColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderC),
              ),
              child: Row(
                children: [
                  Icon(bannerIcon, color: borderC, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: borderC)),
                        Text(subtitle, style: TextStyle(fontSize: 11, color: borderC.withOpacity(0.8))),
                      ],
                    ),
                  ),
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
              color: isDark ? const Color(0xFF0F172A).withOpacity(0.5) : AppColors.bgTertiary,
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
                        Text('EXPLANATION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primaryCyan, letterSpacing: 1)),
                      ],
                    ),
                    TextButton.icon(
                      onPressed: () {
                        HapticService.light();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AIChatConversationScreen(
                              questionId: question['id'],
                              title: 'Question Doubt',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.auto_awesome, size: 14),
                      label: const Text('Ask AI Tutor', style: TextStyle(fontSize: 10)),
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        foregroundColor: AppColors.primaryBlue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                (() {
                  final String rawExplanation = explanation?.toString() ?? '';
                  final isMissing = rawExplanation.trim().isEmpty || 
                                   rawExplanation.trim() == 'No explanation provided.' ||
                                   rawExplanation.trim() == 'No explanation provided' ||
                                   rawExplanation.trim().contains("It seems like you didn't type anything") ||
                                   rawExplanation.trim().length < 5;

                  if (isMissing) {
                    final isGenerating = _generatingIds.contains(question['id']);
                    
                    // Auto-trigger generation if not already doing so
                    if (!isGenerating && !_failedIds.contains(question['id'])) {
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        _generateAIExplanation(
                          question['id'],
                          userAnswer: selectedId?.toString(),
                          examId: _data?['exam']?['id']?.toString() ?? _data?['model']?['id']?.toString(),
                        );
                      });
                    }

                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Column(
                        children: [
                          if (isGenerating) ...[
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryBlue),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Generating AI solution...',
                              style: AppTextStyles.bodySmall.copyWith(color: AppColors.primaryBlue, fontWeight: FontWeight.bold),
                            ),
                          ] else if (_failedIds.contains(question['id'])) ...[
                            const Icon(Icons.error_outline, color: Colors.orange, size: 20),
                            const SizedBox(height: 8),
                            Text(
                              'Failed to generate explanation.',
                              style: AppTextStyles.bodySmall.copyWith(color: Colors.orange),
                            ),
                            TextButton(
                              onPressed: () => setState(() => _failedIds.remove(question['id'])),
                              child: const Text('Try Again', style: TextStyle(fontSize: 12)),
                            ),
                          ] else ...[
                            const SizedBox(height: 12),
                            Text(
                              'AI is preparing your solution...',
                              style: AppTextStyles.bodySmall.copyWith(color: AppColors.textTertiary, fontStyle: FontStyle.italic),
                            ),
                          ],
                        ],
                      ),
                    );
                  }

                  return MathRichText(
                    text: rawExplanation,
                    style: AppTextStyles.bodySmall.copyWith(color: isDark ? Colors.white70 : AppColors.textPrimary),
                  );
                })(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _generateAIExplanation(String questionId, {String? userAnswer, String? examId, int? responseIndex}) async {
    if (_generatingIds.contains(questionId) || _failedIds.contains(questionId)) return;

    setState(() {
      _generatingIds.add(questionId);
    });

    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final queryParams = {
        if (userAnswer != null) 'userAnswer': userAnswer,
        if (examId != null) 'examId': examId,
      };
      
      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final endpoint = '/explanations/$questionId${queryString.isNotEmpty ? '?$queryString' : ''}';
      final response = await apiService.get(endpoint);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newExplanation = data['explanation'];
        
        if (mounted) {
          setState(() {
            _generatingIds.remove(questionId);
            // Update the specific response in the list
            if (responseIndex != null) {
              _responses[responseIndex]['question']['explanation'] = newExplanation;
            } else {
              // Find and update if index wasn't provided
              for (var resp in _responses) {
                if (resp['question']['id'] == questionId) {
                  resp['question']['explanation'] = newExplanation;
                  break;
                }
              }
            }
            _applyFilter(); // Refresh filtered list
          });
          HapticService.light();
        }
      } else {
        setState(() {
          _generatingIds.remove(questionId);
          _failedIds.add(questionId);
        });
      }
    } catch (e) {
      debugPrint('Error generating AI explanation: $e');
      if (mounted) {
        setState(() {
          _generatingIds.remove(questionId);
          _failedIds.add(questionId);
        });
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
    if (correct) return _badge('CORRECT', Theme.of(context).brightness == Brightness.dark ? Colors.greenAccent : Colors.green);
    return _badge('INCORRECT', Theme.of(context).brightness == Brightness.dark ? Colors.redAccent : Colors.red);
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
          Icon(Icons.filter_list_off, size: 64, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No questions match this filter', 
            style: AppTextStyles.bodySmall.copyWith(color: Theme.of(context).textTheme.bodySmall?.color)
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required String tooltip,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticService.light();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Icon(icon, size: 20, color: color),
        ),
      ),
    );
  }

  Future<void> _toggleSave(String questionId) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.post('/users/saved-questions/$questionId/toggle', {});
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final isSaved = data['saved'] as bool;
        setState(() {
          if (isSaved) {
            _savedQuestionIds.add(questionId);
          } else {
            _savedQuestionIds.remove(questionId);
          }
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isSaved ? 'Question saved' : 'Question removed from saved'),
              duration: const Duration(seconds: 1),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Toggle save error: $e');
    }
  }

  void _showReportDialog(String questionId, String content) {
    final textController = TextEditingController();
    String? selectedType;
    final types = [
      {'id': 'wrong_answer', 'label': 'Wrong Answer'},
      {'id': 'wrong_question', 'label': 'Incomplete/Wrong Question'},
      {'id': 'formatting_error', 'label': 'Formatting/Image Issue'},
      {'id': 'explanation_issue', 'label': 'Explanation Issue'},
      {'id': 'other', 'label': 'Other'},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20,
          ),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Report Question', style: AppTextStyles.h3),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('What is the issue?', style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: types.map((t) {
                    final isSelected = selectedType == t['id'];
                    return ChoiceChip(
                      label: Text(t['label']!),
                      selected: isSelected,
                      onSelected: (val) {
                        if (val) setModalState(() => selectedType = t['id']);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                Text('Additional details', style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                TextField(
                  controller: textController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Describe the problem in detail...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: Theme.of(context).cardTheme.color,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (selectedType == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please select an issue type')),
                        );
                        return;
                      }
                      
                      final apiService = Provider.of<ApiService>(context, listen: false);
                      try {
                        await apiService.post('/quality/flag/$questionId', {
                          'type': selectedType,
                          'description': textController.text,
                        });
                        
                        if (mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Thank you for reporting! Our team will review it.')),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to report: $e')),
                          );
                        }
                      }
                    },
                    child: const Text('SUBMIT REPORT'),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
