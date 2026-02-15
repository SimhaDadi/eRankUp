import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'ai_chat_screen.dart';
import 'ai_chat_conversation_screen.dart';

class DoubtsScreen extends StatefulWidget {
  const DoubtsScreen({super.key});

  @override
  State<DoubtsScreen> createState() => _DoubtsScreenState();
}

class _DoubtsScreenState extends State<DoubtsScreen> {
  List<dynamic>? _doubts;
  bool _isLoading = true;
  final TextEditingController _doubtController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchDoubts();
  }

  @override
  void dispose() {
    _doubtController.dispose();
    super.dispose();
  }

  Future<void> _fetchDoubts() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/doubts');
      if (response.statusCode == 200) {
        setState(() {
          _doubts = jsonDecode(response.body) as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching doubts: $e');
      setState(() => _isLoading = false);
    }
  }


  Future<void> _pickAndSearchPhoto(ImageSource source) async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: source, imageQuality: 80);
    
    if (image == null) return;

    if (!mounted) return;
    
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('AI is Analyzing Question...', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ),
    );

    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.uploadFile('/ai/photo-search', image.path, 'file');
      
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      if (response.statusCode == 200 || response.statusCode == 201) {
        final result = jsonDecode(response.body);
        _showResultSheet(result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${response.statusCode} - ${response.body}')),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to connect to AI server: $e')),
        );
      }
    }
  }

  void _showResultSheet(Map<String, dynamic> result) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (_, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                   Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(10)),
                    child: Icon(Icons.auto_awesome, color: Colors.indigo.shade600, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text('AI Solution', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.indigo.shade100),
                ),
                child: Text(
                  result['solution'] ?? 'No solution found.',
                  style: const TextStyle(fontSize: 15, height: 1.6),
                ),
              ),
              const SizedBox(height: 24),
              if (result['similarQuestions'] != null && (result['similarQuestions'] as List).isNotEmpty) ...[
                const Text('SIMILAR PRACTICE MATERIAL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Colors.grey)),
                const SizedBox(height: 12),
                ... (result['similarQuestions'] as List).map((q) => _buildSimilarQuestionCard(q)).toList(),
              ],
               const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSimilarQuestionCard(Map<String, dynamic> q) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(q['content'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text(q['subject']?['title'] ?? 'General', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios, size: 16),
            onPressed: () {
              // Navigation to practice details would go here
            },
          ),
        ],
      ),
    );
  }

  Future<void> _postDoubt() async {
    if (_doubtController.text.trim().isEmpty) return;

    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.post(
        '/doubts',
        {'question': _doubtController.text.trim()},
      );
      
      if (response.statusCode == 201) {
        _doubtController.clear();
        _fetchDoubts(); // Refresh list
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Doubt posted successfully')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error posting doubt: $e');
    }
  }

  void _showAskDoubtDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.help_outline, color: Colors.blue.shade700),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Ask Your Doubt',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _doubtController,
                maxLines: 5,
                decoration: InputDecoration(
                  hintText: 'Describe your doubt in detail...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _postDoubt();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade600,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Post Doubt',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
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
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Doubts & Q/A'),
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAskDoubtDialog,
        icon: const Icon(Icons.history),
        label: const Text('Expert Review'),
        backgroundColor: Colors.grey.shade700,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchDoubts,
        child: CustomScrollView(
          slivers: [
            // AI Tutor Promo
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: _buildAITutorPromo(),
              ),
            ),

            // Section Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Text('Expert Review History', style: AppTextStyles.h3),
                    const Spacer(),
                    if (_doubts != null) Text('${_doubts!.length} Records', style: AppTextStyles.captionSmall),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // List of Experts Doubts
            if (_doubts == null || _doubts!.isEmpty)
              SliverFillRemaining(
                child: _buildEmptyState(),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildDoubtCard(_doubts![index]),
                    childCount: _doubts!.length,
                  ),
                ),
              ),
            
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildAITutorPromo() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              const Text(
                'Instant AI Tutoring',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Don\'t wait for an expert. Get your doubts cleared instantly by our AI Tutor, 24/7.',
            style: TextStyle(color: Colors.white, fontSize: 13, height: 1.5, fontWeight: FontWeight.w400),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _pickAndSearchPhoto(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Scan Question', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF6366F1),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _pickAndSearchPhoto(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Pick Image', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.2),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: const BorderSide(color: Colors.white24),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
                onPressed: () {
                Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AIChatScreen()),
                );
                },
                child: const Text('Or just chat with AI Tutor', style: TextStyle(color: Colors.white70, decoration: TextDecoration.underline)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 48),
          Icon(Icons.question_answer, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No expert reviews yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildDoubtCard(Map<String, dynamic> doubt) {
    final question = doubt['question'] ?? 'No question';
    final answer = doubt['answer'];
    final status = doubt['status'] ?? 'pending';
    final createdAt = doubt['createdAt'];
    final answeredAt = doubt['answeredAt'];

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: status == 'answered' 
            ? (isDark ? Colors.greenAccent.withOpacity(0.5) : Colors.green.shade200) 
            : (isDark ? const Color(0xFF334155) : Colors.grey.shade200),
          width: status == 'answered' ? 2 : 1,
        ),
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
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: status == 'answered' 
                    ? (isDark ? const Color(0xFF064E3B).withOpacity(0.2) : Colors.green.shade50) 
                    : (isDark ? const Color(0xFF78350F).withOpacity(0.2) : Colors.orange.shade50),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      status == 'answered' ? Icons.check_circle : Icons.pending,
                      size: 14,
                      color: status == 'answered' 
                        ? (isDark ? Colors.greenAccent : Colors.green.shade700) 
                        : (isDark ? Colors.orangeAccent : Colors.orange.shade700),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: status == 'answered' 
                          ? (isDark ? Colors.greenAccent : Colors.green.shade700) 
                          : (isDark ? Colors.orangeAccent : Colors.orange.shade700),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (createdAt != null)
                Text(
                  _formatDate(createdAt),
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade500,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Question
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.help_outline, size: 20, color: Colors.blue.shade600),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: TextStyle(
                    fontSize: 14,
                    color: theme.textTheme.bodyLarge?.color,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          
          // Answer (if available)
          if (answer != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A).withOpacity(0.5) : Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? const Color(0xFF064E3B) : Colors.green.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lightbulb, size: 16, color: Colors.green.shade700),
                      const SizedBox(width: 6),
                      Text(
                        'Answer',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                      ),
                      const Spacer(),
                      if (answeredAt != null)
                        Text(
                          _formatDate(answeredAt),
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.green.shade600,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    answer,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white70 : Colors.green.shade900,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, h:mm a').format(date);
    } catch (e) {
      return 'N/A';
    }
  }
}
