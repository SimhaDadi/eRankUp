import 'package:flutter/material.dart';

// Generic screen for PYP, Practice, Quizzes, and Pass
// Can be customized based on the type parameter

class GenericTestScreen extends StatelessWidget {
  final String title;
  final String emptyMessage;
  final IconData emptyIcon;
  final Color accentColor;
  
  const GenericTestScreen({
    super.key,
    required this.title,
    required this.emptyMessage,
    required this.emptyIcon,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        elevation: 0,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 80, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'Coming Soon',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.grey.shade500),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'This feature will be available soon',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: accentColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Previous Year Papers Screen
class PYPScreen extends StatelessWidget {
  const PYPScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const GenericTestScreen(
      title: 'Previous Year Papers',
      emptyMessage: 'Access previous year question papers to practice and prepare better',
      emptyIcon: Icons.history_edu,
      accentColor: Colors.indigo,
    );
  }
}

// Practice Mode Screen
class PracticeScreen extends StatelessWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const GenericTestScreen(
      title: 'Practice Mode',
      emptyMessage: 'Practice questions topic-wise at your own pace',
      emptyIcon: Icons.fitness_center,
      accentColor: Colors.teal,
    );
  }
}

// Free Quizzes Screen
class QuizzesScreen extends StatelessWidget {
  const QuizzesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const GenericTestScreen(
      title: 'Free Quizzes',
      emptyMessage: 'Quick quizzes to test your knowledge on the go',
      emptyIcon: Icons.quiz,
      accentColor: Colors.purple,
    );
  }
}

// Pass (Premium) Screen
class PassScreen extends StatelessWidget {
  const PassScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('eRankUp Pass'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Premium Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: Theme.of(context).brightness == Brightness.dark 
                    ? [const Color(0xFFB45309), const Color(0xFF9A3412)]
                    : [Colors.amber.shade600, Colors.orange.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Icon(Icons.workspace_premium, size: 64, color: Colors.white),
                  const SizedBox(height: 16),
                  const Text(
                    'eRankUp Pass',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.black,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Unlock unlimited access to premium content',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Features List
            _buildFeatureItem(context, Icons.check_circle, 'Unlimited test attempts', Colors.green),
            _buildFeatureItem(context, Icons.check_circle, 'Access to all premium exams', Colors.green),
            _buildFeatureItem(context, Icons.check_circle, 'Detailed performance analytics', Colors.green),
            _buildFeatureItem(context, Icons.check_circle, 'Priority doubt resolution', Colors.green),
            _buildFeatureItem(context, Icons.check_circle, 'Ad-free experience', Colors.green),
            _buildFeatureItem(context, Icons.check_circle, 'Exclusive study materials', Colors.green),
            
            const SizedBox(height: 32),
            
            // Pricing
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade200, width: 2),
              ),
              child: Column(
                children: [
                  const Text(
                    'Special Offer',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '₹',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Text(
                        '999',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.black,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          '/year',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Save 50% on annual plan',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Subscribe Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // Navigate to payment
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFFB45309) : Colors.amber.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Subscribe Now',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.black,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem(BuildContext context, IconData icon, String text, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).brightness == Brightness.dark ? Colors.emeraldAccent : color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
