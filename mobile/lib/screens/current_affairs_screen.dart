import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CurrentAffairsScreen extends StatelessWidget {
  const CurrentAffairsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Current Affairs')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.construction, size: 64, color: AppColors.primaryBlue),
            const SizedBox(height: 16),
            Text('Updating Theme...', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            const Text('Feature will return shortly.', style: AppTextStyles.body),
          ],
        ),
      ),
    );
  }
}
