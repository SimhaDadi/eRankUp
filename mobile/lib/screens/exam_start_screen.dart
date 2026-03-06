import 'package:flutter/material.dart';
import '../models/chapter.dart';
import '../theme/app_theme.dart';
import 'test_engine_screen.dart';

class ExamStartScreen extends StatefulWidget {
  final TestModel model;
  final Map<String, dynamic>? parentMetadata;
  
  const ExamStartScreen({super.key, required this.model, this.parentMetadata});

  @override
  State<ExamStartScreen> createState() => _ExamStartScreenState();
}

class _ExamStartScreenState extends State<ExamStartScreen> {
  bool _showInstructions = true;
  bool _agreedToInstructions = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Exam Details'),
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildExamTitleCard(isDark),
            const SizedBox(height: 16),
            _buildMetadataCards(isDark),
            const SizedBox(height: 16),
            _buildSecureEnvironmentCard(isDark, theme),
            const SizedBox(height: 16),
            _buildInstructionsSection(isDark, theme),
            const SizedBox(height: 16),
            _buildAgreementCheckbox(isDark, theme),
            const SizedBox(height: 24),
            _buildStartButton(isDark),
            const SizedBox(height: 16),
            _buildHelpLink(isDark),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildExamTitleCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
            ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)]
            : [const Color(0xFF2563EB), const Color(0xFF60A5FA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.assignment,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Badges Row
                    if (widget.parentMetadata != null && (widget.parentMetadata!['authority'] != null || widget.parentMetadata!['year'] != null))
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            if (widget.parentMetadata!['authority'] != null)
                              Container(
                                margin: const EdgeInsets.only(right: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: Colors.white.withOpacity(0.4)),
                                ),
                                child: Text(
                                  '${widget.parentMetadata!['authority']}'.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                             if (widget.parentMetadata!['year'] != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: Colors.white.withOpacity(0.4)),
                                ),
                                child: Text(
                                  '${widget.parentMetadata!['year']}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ), 
                          ],
                        ),
                      ),
                    
                    Text(
                      widget.model.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          'Practice Test',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getDifficultyColor(widget.model.difficulty),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.model.difficulty.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetadataCards(bool isDark) {
    return Row(
      children: [
        Expanded(
          child: _buildInfoCard(
            icon: Icons.quiz,
            value: '${widget.model.totalQuestions}',
            label: 'Questions',
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildInfoCard(
            icon: Icons.timer,
            value: '${widget.model.duration}',
            label: 'Minutes',
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildInfoCard(
            icon: Icons.emoji_events,
            value: '${widget.model.totalMarks}',
            label: 'Marks',
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String value,
    required String label,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: AppColors.primaryBlue,
            size: 24,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecureEnvironmentCard(bool isDark, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.shield,
              color: AppColors.primaryBlue,
              size: 32,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Secure Exam Environment',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            'To maintain integrity, this exam must be taken in full-screen mode. Click below to enter the secure environment and begin.',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          _buildFeatureRow(Icons.check_circle, 'Answers auto-saved', isDark),
          const SizedBox(height: 8),
          if (widget.model.allowReview)
            _buildFeatureRow(Icons.check_circle, 'Navigate freely between questions', isDark),
          if (widget.model.allowReview)
            const SizedBox(height: 8),
          if (widget.model.allowCalculator)
            _buildFeatureRow(Icons.check_circle, 'Calculator allowed', isDark),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String text, bool isDark) {
    return Row(
      children: [
        Icon(
          icon,
          color: Colors.green,
          size: 18,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInstructionsSection(bool isDark, ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Theme(
        data: theme.copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: _showInstructions,
          onExpansionChanged: (expanded) {
            setState(() => _showInstructions = expanded);
          },
          leading: Icon(
            Icons.info_outline,
            color: AppColors.primaryBlue,
          ),
          title: Text(
            'Instructions & Rules',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Custom instructions if provided
                  if (widget.model.customInstructions != null) ...[
                    Text(
                      widget.model.customInstructions!,
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? Colors.amber.shade300 : Colors.amber.shade700,
                        fontWeight: FontWeight.w500,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Divider(color: isDark ? Colors.grey.shade700 : Colors.grey.shade300),
                    const SizedBox(height: 12),
                  ],
                  // Dynamic marking scheme
                  _buildInstructionItem(
                    'Each question carries +${widget.model.positiveMarks.toStringAsFixed(widget.model.positiveMarks.truncateToDouble() == widget.model.positiveMarks ? 0 : 1)} marks for correct answer',
                    isDark,
                  ),
                  if (widget.model.negativeMarks > 0)
                    _buildInstructionItem(
                      'Incorrect answers have -${widget.model.negativeMarks.toStringAsFixed(widget.model.negativeMarks.truncateToDouble() == widget.model.negativeMarks ? 0 : 1)} negative marking',
                      isDark,
                    ),
                  if (widget.model.allowReview)
                    _buildInstructionItem('You can mark questions for review and revisit them', isDark),
                  if (widget.model.allowSkip)
                    _buildInstructionItem('You can skip questions and answer them later', isDark),
                  _buildInstructionItem('Exam will auto-submit when time expires', isDark),
                  _buildInstructionItem('Do not refresh or close the browser during the exam', isDark),
                  _buildInstructionItem('Ensure stable internet connection throughout', isDark),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionItem(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 6),
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: AppColors.primaryBlue,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAgreementCheckbox(bool isDark, ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        color: isDark 
          ? const Color(0xFF1E293B).withOpacity(0.5) 
          : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _agreedToInstructions 
            ? AppColors.primaryBlue 
            : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
          width: _agreedToInstructions ? 2 : 1,
        ),
      ),
      child: CheckboxListTile(
        value: _agreedToInstructions,
        onChanged: (value) {
          setState(() => _agreedToInstructions = value ?? false);
        },
        activeColor: AppColors.primaryBlue,
        title: Text(
          'I have read and understood the instructions',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        controlAffinity: ListTileControlAffinity.leading,
      ),
    );
  }

  Widget _buildStartButton(bool isDark) {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: _agreedToInstructions
            ? () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TestEngineScreen(model: widget.model),
                  ),
                );
              }
            : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryBlue,
          foregroundColor: Colors.white,
          disabledBackgroundColor: isDark 
            ? Colors.grey.shade800 
            : Colors.grey.shade300,
          elevation: _agreedToInstructions ? 4 : 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _agreedToInstructions ? 'START EXAM' : 'PLEASE ACCEPT INSTRUCTIONS',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: _agreedToInstructions 
                  ? Colors.white 
                  : (isDark ? Colors.grey.shade600 : Colors.grey.shade500),
              ),
            ),
            if (_agreedToInstructions) ...[
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward, size: 20),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHelpLink(bool isDark) {
    return Center(
      child: TextButton.icon(
        onPressed: () {
          // TODO: Implement help/support
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Support feature coming soon!')),
          );
        },
        icon: Icon(
          Icons.help_outline,
          size: 18,
          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
        ),
        label: Text(
          'Need help? Contact Support',
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.green;
      case 'hard':
        return Colors.red;
      case 'medium':
      default:
        return Colors.orange;
    }
  }
}
