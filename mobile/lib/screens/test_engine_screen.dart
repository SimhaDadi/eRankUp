import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/haptic_service.dart';
import '../models/chapter.dart';
import '../models/question.dart';
import 'results_screen.dart';

class TestEngineScreen extends StatefulWidget {
  final TestModel model;
  const TestEngineScreen({super.key, required this.model});

  @override
  State<TestEngineScreen> createState() => _TestEngineScreenState();
}

class _TestEngineScreenState extends State<TestEngineScreen> {
  List<Question> _allQuestions = [];
  Map<String, List<int>> _sections = {}; // Section Name -> List of Indices
  String _activeSection = '';
  
  Map<String, String> _userAnswers = {};
  Set<String> _flaggedIds = {};
  Set<String> _visitedIds = {};
  
  // ignore: prefer_final_fields
  Map<String, int> _timings = {}; // questionId -> seconds spent

  int _currentIndex = 0;
  bool _isLoading = true;
  int _timeLeft = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startSession();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _startSession() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.post('/test-session/start', {
        'testId': widget.model.id,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _allQuestions = (data['questions'] as List?)
              ?.map((q) => Question.fromJson(q))
              .toList() ?? [];

          // Initialize Sections
          _sections = {};
          for (int i = 0; i < _allQuestions.length; i++) {
             // Assuming Question model has a 'topic' field, else default to 'General'
             // Since the model might not strictly match, we'll try to use a property if available
             // For now, let's look at the raw data if needed, or assume 'topic' exists on Question object
             // modifying Question model is out of scope unless we see it. 
             // Let's assume grouping by some logic or default to 'General' if missing.
             // We'll mimic the Web logic: if no topic, use 'General'.
             // *Wait*, checking Question definition in previous context...
             // It wasn't explicitly shown in full detail but `TestPage` used `q.topic`.
             // I will assume `Question` class has `topic` or I add a safe fallback.
             final topic = 'General'; // Placeholder if dynamic topic isn't in local model yet.
             // Ideally we'd map this from backend content. 
             if (!_sections.containsKey(topic)) _sections[topic] = [];
             _sections[topic]!.add(i);
          }
           // Basic fix: If all topics are same, maybe split by 25?
           // Actually, let's try to infer or just use "General" for now to avoid breaking if `topic` key is missing in Dart model. 
           // *better*: If we parsed keys, use them.
           if (_sections.isEmpty && _allQuestions.isNotEmpty) {
             _sections['All Questions'] = List.generate(_allQuestions.length, (i) => i);
           }
           _activeSection = _sections.keys.first;
           _currentIndex = _sections[_activeSection]!.first;

          // Resume state
          if (data['answers'] != null) {
            _userAnswers = Map<String, String>.from(data['answers']);
          }
          if (data['flags'] != null) {
            _flaggedIds = Set<String>.from(data['flags']);
          }

          _timeLeft = (data['duration'] ?? 60) * 60; // Default 60 mins
          _isLoading = false;
        });
        
        // Manual section parsing if 'topic' exists in raw JSON but not in Dart Model
        // (Just a safe fallback for this iteration)
        if (_allQuestions.isNotEmpty) {
             final rawQs = data['questions'] as List;
             Map<String, List<int>> tempSections = {};
             for(int i=0; i<rawQs.length; i++) {
                 String topic = rawQs[i]['topic'] ?? 'General';
                 if (!tempSections.containsKey(topic)) tempSections[topic] = [];
                 tempSections[topic]!.add(i);
             }
             setState(() {
                 _sections = tempSections;
                 _activeSection = _sections.keys.first;
                 _currentIndex = _sections[_activeSection]!.first;
             });
        }

        _startTimer();
      }
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() {
             _timeLeft--;
             // Track Question Timing
             if (_allQuestions.isNotEmpty) {
                 final currentId = _allQuestions[_currentIndex].id;
                 _timings[currentId] = (_timings[currentId] ?? 0) + 1;
             }
        });
      } else {
        _submitTest();
      }
    });
  }

  Future<void> _toggleFlag(String questionId) async {
    HapticService.light();
    final apiService = Provider.of<ApiService>(context, listen: false);
    setState(() {
      if (_flaggedIds.contains(questionId)) {
        _flaggedIds.remove(questionId);
      } else {
        _flaggedIds.add(questionId);
      }
    });

    try {
      await apiService.post('/test-session/${widget.model.id}/flag', {
        'questionId': questionId,
      });
    } catch (e) {
      debugPrint('Error toggling flag: $e');
    }
  }

  Future<void> _saveAnswer(String questionId, String answerId) async {
    HapticService.light();
    final apiService = Provider.of<ApiService>(context, listen: false);
    setState(() {
      _userAnswers[questionId] = answerId;
    });

    try {
      await apiService.post('/test-session/${widget.model.id}/answer', {
        'questionId': questionId,
        'answerId': answerId,
      });
    } catch (e) {
      debugPrint('Error saving answer: $e');
    }
  }

  Future<void> _submitTest() async {
    _timer?.cancel();
    showDialog(
      context: context, 
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator())
    );
    
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      // Include timings in submission
      final response = await apiService.post('/test-session/${widget.model.id}/submit', {
          'timings': _timings,
          'answers': _userAnswers
      });
      HapticService.success();

      if (mounted) Navigator.pop(context); // Close loading dialog

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => ResultsScreen(attemptId: data['attemptId']),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      debugPrint('Error: $e');
    }
  }
  
  void _jumpToQuestion(int index) {
      setState(() {
          _currentIndex = index;
          // Sync active section if needed
          for (var entry in _sections.entries) {
              if (entry.value.contains(index)) {
                  _activeSection = entry.key;
                  break;
              }
          }
          if (_allQuestions.isNotEmpty) {
              _visitedIds.add(_allQuestions[index].id);
          }
      });
      Navigator.pop(context); // Close drawer
  }

  String _formatTime(int seconds) {
    if (seconds < 0) return "00:00";
    int h = seconds ~/ 3600;
    int m = (seconds % 3600) ~/ 60;
    int s = seconds % 60;
    return '${h > 0 ? '$h:' : ''}${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
  
  Color _getStatusColor(int index, String id) {
       bool isAnswered = _userAnswers.containsKey(id);
       bool isFlagged = _flaggedIds.contains(id);
       bool isVisited = _visitedIds.contains(id) || index == _currentIndex; // Current counts as visited
       
       if (isFlagged && isAnswered) return const Color(0xFF7C3AED); // Purple
       if (isFlagged) return const Color(0xFFA855F7); // Lighter Purple
       if (isAnswered) return const Color(0xFF22C55E); // Green
       if (isVisited) return const Color(0xFFEF4444); // Red (Not Answered)
       return Colors.white; // Not Visited
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_allQuestions.isEmpty) return const Scaffold(body: Center(child: Text("No questions found.")));

    final question = _allQuestions[_currentIndex];
    final bool isFlagged = _flaggedIds.contains(question.id);
    
    // Ensure current question is marked visited
    _visitedIds.add(question.id);

    return Scaffold(
      drawer: Drawer(
          width: MediaQuery.of(context).size.width * 0.85,
          child: Column(
              children: [
                  Container(
                      padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 50, AppSpacing.xl, AppSpacing.xl),
                      color: AppColors.infoBg,
                      child: Column(
                          children: [
                             Row(
                                 children: [
                                     const CircleAvatar(backgroundColor: AppColors.primaryBlue, child: Icon(Icons.person, color: Colors.white)),
                                     const SizedBox(width: AppSpacing.md),
                                     Column(
                                         crossAxisAlignment: CrossAxisAlignment.start,
                                         children: [
                                             const Text("Demo User", style: TextStyle(fontWeight: FontWeight.bold)),
                                             Text(widget.model.title, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                         ],
                                     )
                                 ],
                             ),
                             const SizedBox(height: 20),
                             // Legend
                             Row(
                                 mainAxisAlignment: MainAxisAlignment.spaceAround,
                                 children: [
                                     _buildLegendItem(const Color(0xFF22C55E), "Ans"),
                                     _buildLegendItem(const Color(0xFFEF4444), "Skip"),
                                     _buildLegendItem(const Color(0xFF7C3AED), "Mark"),
                                     _buildLegendItem(Colors.white, "New", border: true),
                                 ]
                             )
                          ],
                      ),
                  ),
                  Expanded(
                      child: ListView(
                          padding: const EdgeInsets.all(16),
                          children: _sections.entries.map((entry) {
                              return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                      Padding(
                                          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                                          child: Text(entry.key, style: AppTextStyles.h4.copyWith(color: AppColors.primaryBlue)),
                                      ),
                                      Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          children: entry.value.map((idx) {
                                              final qId = _allQuestions[idx].id;
                                              return GestureDetector(
                                                  onTap: () => _jumpToQuestion(idx),
                                                  child: Container(
                                                      width: 40, 
                                                      height: 40,
                                                      decoration: BoxDecoration(
                                                          color: _getStatusColor(idx, qId),
                                                          border: Border.all(color: Colors.grey.shade300),
                                                          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                                                      ),
                                                      child: Stack(
                                                          children: [
                                                              Center(child: Text('${idx+1}', style: TextStyle(
                                                                  fontWeight: FontWeight.bold,
                                                                  color: _getStatusColor(idx, qId) == Colors.white ? Colors.black87 : Colors.white
                                                              ))),
                                                              if (_currentIndex == idx)
                                                                  Positioned.fill(
                                                                      child: Container(
                                                                          decoration: BoxDecoration(
                                                                              border: Border.all(color: Colors.blue, width: 2),
                                                                              borderRadius: BorderRadius.circular(8)
                                                                          ),
                                                                      )
                                                                  )
                                                          ],
                                                      )
                                                  ),
                                              );
                                          }).toList(),
                                      ),
                                      const Divider(height: 30),
                                  ],
                              );
                          }).toList(),
                      ),
                  ),
                  Padding(
                      padding: const EdgeInsets.all(16),
                      child: ElevatedButton(
                          onPressed: _submitTest,
                          style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00BFA5),
                              foregroundColor: Colors.white,
                              minimumSize: const Size(double.infinity, 50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text("SUBMIT TEST", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                      ),
                  ),
              ],
          ),
      ),
      appBar: AppBar(
        title: Text(_activeSection, style: const TextStyle(fontSize: 16)), // Show Section Title
        actions: [
          IconButton(
            icon: Icon(
              isFlagged ? Icons.flag : Icons.flag_outlined,
              color: isFlagged ? Colors.amber : null,
            ),
            onPressed: () => _toggleFlag(question.id),
            tooltip: 'Mark for Review',
          ),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: _timeLeft < 300 ? AppColors.errorBg : AppColors.infoBg,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
                      border: Border.all(color: _timeLeft < 300 ? AppColors.errorBorder : AppColors.infoBorder)
                  ),
                  child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                          Icon(Icons.timer, size: 16, color: _timeLeft < 300 ? AppColors.errorDark : AppColors.primaryBlue),
                          const SizedBox(width: 4),
                          Text(
                            _formatTime(_timeLeft),
                            style: TextStyle(
                              fontWeight: FontWeight.bold, 
                              fontSize: 14, 
                              color: _timeLeft < 300 ? AppColors.errorDark : AppColors.primaryBlue
                            ),
                          ),
                      ],
                  )
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Section Tabs (Horizontal Scroll)
          SizedBox(
              height: 50,
              child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  children: _sections.keys.map((sec) {
                      bool isActive = sec == _activeSection;
                      return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: ChoiceChip(
                              label: Text(sec),
                              selected: isActive,
                              onSelected: (bool selected) {
                                  if (selected) {
                                      setState(() {
                                          _activeSection = sec;
                                          _currentIndex = _sections[sec]!.first;
                                          _visitedIds.add(_allQuestions[_currentIndex].id);
                                      });
                                  }
                              },
                              selectedColor: AppColors.infoBg,
                              labelStyle: TextStyle(color: isActive ? AppColors.primaryBlue : AppColors.textSecondary, fontWeight: FontWeight.bold),
                          ),
                      );
                  }).toList(),
              ),
          ),
          
          Expanded(
            child: GestureDetector(
              onHorizontalDragEnd: (details) {
                if (details.primaryVelocity! > 0) {
                  // Swipe Right -> Previous
                  if (_currentIndex > 0) setState(() { _currentIndex--; _visitedIds.add(_allQuestions[_currentIndex].id); });
                } else if (details.primaryVelocity! < 0) {
                  // Swipe Left -> Next
                  if (_currentIndex < _allQuestions.length - 1) {
                    setState(() { _currentIndex++; _visitedIds.add(_allQuestions[_currentIndex].id);});
                    if (_currentIndex == _allQuestions.length - 1) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("You have reached the last question"),
                          duration: Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                        )
                      );
                    }
                  }
                }
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppSpacing.xxl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Q. ${_currentIndex + 1}',
                          style: AppTextStyles.h3.copyWith(color: AppColors.primaryBlue),
                        ),
                        if (isFlagged)
                          const Chip(
                            label: Text('REVIEW', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                            backgroundColor: Colors.amber, 
                            labelPadding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    MathRichText(
                      text: question.content,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500, height: 1.5),
                    ),
                    const SizedBox(height: 32),
                    ...question.options.map((option) {
                      bool isSelected = _userAnswers[question.id] == option.id;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => _saveAnswer(question.id, option.id),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.infoBg : AppColors.bgPrimary,
                              border: Border.all(
                                color: isSelected ? AppColors.primaryBlue : Colors.grey.shade200,
                                width: isSelected ? 2 : 1,
                              ),
                              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                              boxShadow: [
                                  if (isSelected) BoxShadow(color: AppColors.primaryBlue.withOpacity(0.1), blurRadius: 4, offset: const Offset(0, 2))
                              ]
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: isSelected ? AppColors.primaryBlue : Colors.grey.shade400, width: 2),
                                    color: isSelected ? AppColors.primaryBlue : Colors.transparent,
                                  ),
                                  child: isSelected ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: MathRichText(
                                    text: option.text, 
                                    style: TextStyle(fontSize: 16, color: isSelected ? AppColors.primaryBlue : AppColors.textSecondary)
                                  )
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _currentIndex > 0
                  ? OutlinedButton(
                      onPressed: () => setState(() { _currentIndex--; _visitedIds.add(_allQuestions[_currentIndex].id); }),
                      style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md)
                      ),
                      child: const Text('Previous'),
                    )
                  : const SizedBox(width: 80),
                
                Builder(
                    builder: (context) => IconButton(
                        onPressed: () => Scaffold.of(context).openDrawer(), 
                        icon: const Icon(Icons.grid_view, color: Colors.grey)
                    )
                ),

                _currentIndex < _allQuestions.length - 1
                  ? ElevatedButton.icon(
                      onPressed: () {
                         setState(() { _currentIndex++; _visitedIds.add(_allQuestions[_currentIndex].id); });
                         if (_currentIndex == _allQuestions.length - 1) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("You have reached the last question"),
                                duration: Duration(seconds: 2),
                                behavior: SnackBarBehavior.floating,
                              )
                            );
                         }
                      },
                      icon: const Icon(Icons.chevron_right),
                      label: const Text('Next'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlue, 
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                      ),
                      child: const Text('Save & Next'),
                    )
                  : ElevatedButton(
                      onPressed: _submitTest,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryCyan, 
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                      ),
                      child: const Text('Submit'),
                    ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLegendItem(Color color, String label, {bool border = false}) {
      return Row(
          children: [
              Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: border ? Border.all(color: Colors.grey) : null
                  ),
              ),
              const SizedBox(width: 4),
              Text(label, style: const TextStyle(fontSize: 10))
          ],
      );
  }
}

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
