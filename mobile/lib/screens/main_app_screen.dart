import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/engagement_services.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'exams_screen.dart';
import 'performance_screen.dart';
import 'settings_screen.dart';
import 'ai_chat_screen.dart';
import 'community_screen.dart';

class MainAppScreen extends StatefulWidget {
  const MainAppScreen({super.key});

  @override
  State<MainAppScreen> createState() => _MainAppScreenState();
}

class _MainAppScreenState extends State<MainAppScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _initializeFCM();
  }

  void _initializeFCM() {
    final apiService = Provider.of<ApiService>(context, listen: false);
    FCMService().initialize(apiService);
  }
  
  final List<Widget> _screens = const [
    HomeScreen(),
    ExamsScreen(),
    AIChatScreen(),
    CommunityScreen(),
    SettingsScreen(),
  ];

  void _onTabTapped(int index) {
    if (index != _currentIndex) {
      // Haptic feedback on tab change
      HapticFeedback.lightImpact();
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), // Padding to make it float
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark 
                ? const Color(0xFF1E293B) 
                : Colors.white,
            borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
            boxShadow: AppShadows.medium,
            border: Border.all(
              color: Theme.of(context).brightness == Brightness.dark 
                  ? const Color(0xFF334155) 
                  : Colors.grey.shade100,
              width: 1.5,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
            child: Theme(
              data: Theme.of(context).copyWith(
                navigationBarTheme: NavigationBarThemeData(
                  labelTextStyle: WidgetStateProperty.resolveWith((states) {
                    final isSelected = states.contains(WidgetState.selected);
                    return TextStyle(
                      fontSize: 10,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    );
                  }),
                ),
              ),
              child: NavigationBar(
              selectedIndex: _currentIndex,
              onDestinationSelected: _onTabTapped,
              height: 60,
              backgroundColor: Colors.transparent,
              elevation: 0,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              animationDuration: const Duration(milliseconds: 300),
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined, size: 22),
                  selectedIcon: Icon(Icons.home, size: 22),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(Icons.quiz_outlined, size: 22),
                  selectedIcon: Icon(Icons.quiz, size: 22),
                  label: 'Tests',
                ),
                NavigationDestination(
                  icon: Icon(Icons.auto_awesome_outlined, size: 22),
                  selectedIcon: Icon(Icons.auto_awesome, size: 22),
                  label: 'Tutor',
                ),
                NavigationDestination(
                  icon: Icon(Icons.people_outline, size: 22),
                  selectedIcon: Icon(Icons.people, size: 22),
                  label: 'Community',
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline, size: 22),
                  selectedIcon: Icon(Icons.person, size: 22),
                  label: 'Profile',
                ),
              ],
            ),
          ), // closes Theme
          ), // closes ClipRRect
        ),
      ),
    );
  }
}
