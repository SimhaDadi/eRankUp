import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/theme_provider.dart';
import '../theme/app_theme.dart';
import 'subscription_screen.dart';
import 'edit_profile_screen.dart';
import 'reported_questions_screen.dart';
import '../main.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  Map<String, dynamic>? _currentPass;
  bool _isLoadingPass = true;

  @override
  void initState() {
    super.initState();
    _fetchCurrentPass();
  }

  Future<void> _fetchCurrentPass() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/passes/current');
      if (response.statusCode == 200 && response.body.isNotEmpty) {
        setState(() {
          _currentPass = jsonDecode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Error fetching pass in settings: $e');
    } finally {
      setState(() => _isLoadingPass = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Account Section
          _buildSectionHeader('Account'),
          _buildSettingsTile(
            icon: Icons.person,
            title: 'Profile',
            subtitle: 'Manage your profile information',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              ).then((_) => _fetchCurrentPass()); // Refresh on return
            },
          ),
          _buildSettingsTile(
            icon: Icons.workspace_premium,
            title: 'Subscription',
            subtitle: 'Manage your subscription plan',
            trailing: _isLoadingPass
                ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2))
                : Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _currentPass != null 
                        ? (theme.brightness == Brightness.dark ? Colors.teal.shade900 : Colors.teal.shade100) 
                        : (theme.brightness == Brightness.dark ? Colors.amber.shade900 : Colors.amber.shade100),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _currentPass != null ? 'PREMIUM' : 'FREE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: _currentPass != null 
                          ? (theme.brightness == Brightness.dark ? Colors.teal.shade100 : Colors.teal.shade700) 
                          : (theme.brightness == Brightness.dark ? Colors.amber.shade100 : Colors.amber.shade700),
                      ),
                    ),
                  ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
              ).then((_) => _fetchCurrentPass());
            },
          ),
          
          const SizedBox(height: 24),
          
          // Notifications Section
          _buildSectionHeader('Notifications'),
          _buildSwitchTile(
            icon: Icons.notifications,
            title: 'Enable Notifications',
            subtitle: 'Receive updates and reminders',
            value: _notificationsEnabled,
            onChanged: (val) => setState(() => _notificationsEnabled = val),
          ),
          if (_notificationsEnabled) ...[
            _buildSwitchTile(
              icon: Icons.email,
              title: 'Email Notifications',
              subtitle: 'Get updates via email',
              value: _emailNotifications,
              onChanged: (val) => setState(() => _emailNotifications = val),
            ),
            _buildSwitchTile(
              icon: Icons.phone_android,
              title: 'Push Notifications',
              subtitle: 'Get instant alerts on your device',
              value: _pushNotifications,
              onChanged: (val) => setState(() => _pushNotifications = val),
            ),
          ],
          
          const SizedBox(height: 24),
          
          // Appearance Section
          _buildSectionHeader('Appearance'),
          _buildSwitchTile(
            icon: Icons.dark_mode,
            title: 'Dark Mode',
            subtitle: 'Switch to dark theme',
            value: themeProvider.isDarkMode,
            onChanged: (val) => themeProvider.toggleTheme(),
          ),
          
          const SizedBox(height: 24),
          
          // Support Section
          _buildSectionHeader('Support'),
          _buildSettingsTile(
            icon: Icons.help_outline,
            title: 'Help & FAQ',
            subtitle: 'Get answers to common questions',
            onTap: () {},
          ),
          _buildSettingsTile(
            icon: Icons.report_problem_outlined,
            title: 'Reported Questions',
            subtitle: 'Track your flagged items',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ReportedQuestionsScreen()),
              );
            },
          ),
          _buildSettingsTile(
            icon: Icons.feedback,
            title: 'Send Feedback',
            subtitle: 'Help us improve the app',
            onTap: () {},
          ),
          _buildSettingsTile(
            icon: Icons.info_outline,
            title: 'About',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),
          
          const SizedBox(height: 24),
          
          // Logout Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                _showLogoutDialog();
              },
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text(
                'Logout',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: theme.colorScheme.primary, size: 24),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: theme.brightness == Brightness.dark ? Colors.white60 : Colors.grey.shade600,
          ),
        ),
        trailing: trailing ?? Icon(Icons.chevron_right, color: theme.brightness == Brightness.dark ? Colors.white24 : Colors.grey.shade400),
        onTap: onTap,
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      child: SwitchListTile(
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: theme.colorScheme.primary, size: 24),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: theme.brightness == Brightness.dark ? Colors.white60 : Colors.grey.shade600,
          ),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: theme.colorScheme.primary,
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final apiService = Provider.of<ApiService>(context, listen: false);
              await apiService.logout();
              if (mounted) {
                Navigator.pop(context);
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => ERankUpApp()),
                  (route) => false,
                );
              }
            },
            child: const Text(
              'Logout',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

// Profile Screen
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final user = await apiService.getUserProfile();
    setState(() {
      _user = user;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final fullName = _user?['fullName'] ?? 'Guest User';
    final email = _user?['email'] ?? 'No email';
    final phone = _user?['phone'] ?? 'Not provided';
    final dob = _user?['dob'] ?? 'Not provided';
    final education = _user?['education'] ?? 'Not provided';
    final category = _user?['category'] ?? 'Not provided';
    final location = _user?['location'] ?? 'Not provided';
    final language = _user?['defaultLanguage'] ?? 'English';
    final role = _user?['role'] ?? 'STUDENT';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Profile Picture
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: Theme.of(context).brightness == Brightness.dark 
                          ? [const Color(0xFF1E40AF), const Color(0xFF1E3A8A)]
                          : [Colors.blue.shade400, Colors.blue.shade600],
                      ),
                    ),
                    child: Center(
                      child: Text(
                        fullName.isNotEmpty ? fullName[0].toUpperCase() : 'G',
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // User Info
            _buildInfoTile('Full Name', fullName, Icons.person),
            _buildInfoTile('Email', email, Icons.email),
            _buildInfoTile('Phone', phone, Icons.phone),
            _buildInfoTile('Date of Birth', dob, Icons.calendar_today),
            _buildInfoTile('Education', education, Icons.school),
            _buildInfoTile('Category', category, Icons.tag),
            _buildInfoTile('Location', location, Icons.location_on),
            _buildInfoTile('Language', language, Icons.language),
            _buildInfoTile('Role', role, Icons.admin_panel_settings),
            
            const SizedBox(height: 24),
            
            // Edit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  if (_user == null) return;
                  final refresh = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => EditProfileScreen(user: _user!),
                    ),
                  );
                  if (refresh == true) {
                    _fetchProfile();
                  }
                },
                icon: const Icon(Icons.edit),
                label: const Text('Edit Profile'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF2563EB) : Colors.blue.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(String label, String value, IconData icon) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: isDark ? const Color(0xFF60A5FA) : Colors.blue.shade600, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: theme.textTheme.bodyLarge?.color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
