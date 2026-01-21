import 'dart:math';
import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import '../theme/app_theme.dart';

/// Dynamic results feedback based on score
/// Shows different animations and messages for different score ranges

class DynamicResultsFeedback extends StatefulWidget {
  final int score;
  final int totalQuestions;
  final int correctAnswers;
  
  const DynamicResultsFeedback({
    super.key,
    required this.score,
    required this.totalQuestions,
    required this.correctAnswers,
  });

  @override
  State<DynamicResultsFeedback> createState() => _DynamicResultsFeedbackState();
}

class _DynamicResultsFeedbackState extends State<DynamicResultsFeedback>
    with SingleTickerProviderStateMixin {
  late ConfettiController _confettiController;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.elasticOut,
      ),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );
    
    // Start animations
    _animationController.forward();
    
    // Show confetti for high scores
    if (widget.score >= 80) {
      Future.delayed(const Duration(milliseconds: 500), () {
        _confettiController.play();
      });
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  ScoreFeedback _getFeedback() {
    if (widget.score >= 90) {
      return ScoreFeedback(
        emoji: '🎉',
        title: 'Outstanding!',
        message: 'You\'re in the top 5%!',
        subtitle: 'Exceptional performance',
        gradient: LinearGradient(
          colors: [Colors.green.shade600, Colors.teal.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        backgroundColor: Colors.green.shade50,
      );
    } else if (widget.score >= 75) {
      return ScoreFeedback(
        emoji: '🌟',
        title: 'Great Job!',
        message: 'Keep up the excellent work!',
        subtitle: 'You\'re doing amazing',
        gradient: LinearGradient(
          colors: [Colors.blue.shade600, Colors.indigo.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        backgroundColor: Colors.blue.shade50,
      );
    } else if (widget.score >= 60) {
      return ScoreFeedback(
        emoji: '👍',
        title: 'Good Effort!',
        message: 'You\'re making progress!',
        subtitle: 'Keep practicing',
        gradient: LinearGradient(
          colors: [Colors.orange.shade600, Colors.amber.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        backgroundColor: Colors.orange.shade50,
      );
    } else if (widget.score >= 40) {
      return ScoreFeedback(
        emoji: '💪',
        title: 'Keep Practicing!',
        message: 'Every attempt makes you stronger!',
        subtitle: 'You\'re improving',
        gradient: LinearGradient(
          colors: [Colors.purple.shade600, Colors.pink.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        backgroundColor: Colors.purple.shade50,
      );
    } else {
      return ScoreFeedback(
        emoji: '📚',
        title: 'Don\'t Give Up!',
        message: 'Review the topics and try again',
        subtitle: 'Practice makes perfect',
        gradient: LinearGradient(
          colors: [Colors.red.shade600, Colors.orange.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        backgroundColor: Colors.red.shade50,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final feedback = _getFeedback();
    
    return Stack(
      alignment: Alignment.topCenter,
      children: [
        // Main content
        FadeTransition(
          opacity: _fadeAnimation,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.xxxl),
            decoration: BoxDecoration(
              gradient: feedback.gradient,
              borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
              boxShadow: [
                BoxShadow(
                  color: feedback.gradient.colors.first.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              children: [
                // Emoji with scale animation
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Text(
                    feedback.emoji,
                    style: const TextStyle(fontSize: 80),
                  ),
                ),
                
                const SizedBox(height: AppSpacing.lg),
                
                // Title
                Text(
                  feedback.title,
                  style: AppTextStyles.h1.copyWith(
                    color: Colors.white,
                    fontSize: 32,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: AppSpacing.sm),
                
                // Message
                Text(
                  feedback.message,
                  style: AppTextStyles.body.copyWith(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: AppSpacing.xxl),
                
                // Score display
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xxl,
                    vertical: AppSpacing.lg,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${widget.score}%',
                        style: const TextStyle(
                          fontSize: 64,
                          fontWeight: FontWeight.black,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        '${widget.correctAnswers}/${widget.totalQuestions} Correct',
                        style: AppTextStyles.body.copyWith(
                          color: Colors.white.withOpacity(0.9),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: AppSpacing.lg),
                
                // Subtitle
                Text(
                  feedback.subtitle,
                  style: AppTextStyles.caption.copyWith(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
        
        // Confetti overlay
        if (widget.score >= 80)
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirection: pi / 2, // Down
              maxBlastForce: 5,
              minBlastForce: 2,
              emissionFrequency: 0.05,
              numberOfParticles: 20,
              gravity: 0.3,
              colors: const [
                Colors.green,
                Colors.blue,
                Colors.pink,
                Colors.orange,
                Colors.purple,
                Colors.yellow,
              ],
            ),
          ),
      ],
    );
  }
}

class ScoreFeedback {
  final String emoji;
  final String title;
  final String message;
  final String subtitle;
  final Gradient gradient;
  final Color backgroundColor;

  ScoreFeedback({
    required this.emoji,
    required this.title,
    required this.message,
    required this.subtitle,
    required this.gradient,
    required this.backgroundColor,
  });
}

/// Animated score counter
class AnimatedScoreCounter extends StatefulWidget {
  final int score;
  final Duration duration;
  
  const AnimatedScoreCounter({
    super.key,
    required this.score,
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  State<AnimatedScoreCounter> createState() => _AnimatedScoreCounterState();
}

class _AnimatedScoreCounterState extends State<AnimatedScoreCounter>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<int> _scoreAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    
    _scoreAnimation = IntTween(begin: 0, end: widget.score).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
      ),
    );
    
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scoreAnimation,
      builder: (context, child) {
        return Text(
          '${_scoreAnimation.value}%',
          style: const TextStyle(
            fontSize: 64,
            fontWeight: FontWeight.black,
            color: Colors.white,
          ),
        );
      },
    );
  }
}
