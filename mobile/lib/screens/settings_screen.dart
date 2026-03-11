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
  Map<String, dynamic>? _user;
  bool _isLoadingPass = true;

  @override
  void initState() {
    super.initState();
    _fetchCurrentPass();
    _fetchUser();
  }

  Future<void> _fetchCurrentPass() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/passes/current');
      if (response.statusCode == 200 && response.body.isNotEmpty) {
        setState(() => _currentPass = jsonDecode(response.body));
      }
    } catch (e) {
      debugPrint('Error fetching pass: $e');
    } finally {
      setState(() => _isLoadingPass = false);
    }
  }

  Future<void> _fetchUser() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final user = await apiService.getUserProfile();
      if (mounted) setState(() => _user = user);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);

    final fullName = _user?['fullName'] ?? 'Student';
    final email = _user?['email'] ?? '';
    final initial = fullName.isNotEmpty ? fullName[0].toUpperCase() : 'S';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0F1E) : const Color(0xFFF4F7FF),
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // ──── Hero Profile Card ────
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1A3A8A), Color(0xFF2456C8), Color(0xFF3A7BD5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(AppSpacing.radiusXl),
                  bottomRight: Radius.circular(AppSpacing.radiusXl),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.screenPadding, AppSpacing.xl,
                AppSpacing.screenPadding, AppSpacing.xl,
              ),
              child: Column(
                children: [
                  // Avatar
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.2),
                      border: Border.all(color: Colors.white.withOpacity(0.5), width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        initial,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    fullName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3,
                    ),
                  ),
                  if (email.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  // Plan badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _isLoadingPass
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: _currentPass != null
                                    ? Colors.tealAccent.withOpacity(0.25)
                                    : Colors.amber.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                                border: Border.all(
                                  color: _currentPass != null ? Colors.tealAccent : Colors.amber,
                                  width: 1.5,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _currentPass != null ? Icons.workspace_premium_rounded : Icons.star_border_rounded,
                                    size: 14,
                                    color: _currentPass != null ? Colors.tealAccent : Colors.amber,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    _currentPass != null ? 'PREMIUM PLAN' : 'FREE PLAN',
                                    style: TextStyle(
                                      color: _currentPass != null ? Colors.tealAccent : Colors.amber,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  // Edit Profile button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ProfileScreen()),
                      ).then((_) => _fetchUser()),
                      icon: const Icon(Icons.edit_rounded, size: 16),
                      label: const Text('View & Edit Profile'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primaryBlue,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.xl, AppSpacing.screenPadding, AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Account ──
                  _sectionLabel('Account', isDark),
                  _tile(
                    icon: Icons.workspace_premium_rounded,
                    label: 'Subscription',
                    subtitle: 'Manage your plan',
                    isDark: isDark,
                    trailing: _currentPass != null
                        ? _badge('PREMIUM', Colors.tealAccent)
                        : _badge('FREE', Colors.amber),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
                    ).then((_) => _fetchCurrentPass()),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // ── Notifications ──
                  _sectionLabel('Notifications', isDark),
                  _switchTile(
                    icon: Icons.notifications_rounded,
                    label: 'All Notifications',
                    subtitle: 'Receive updates and reminders',
                    isDark: isDark,
                    value: _notificationsEnabled,
                    onChanged: (v) => setState(() => _notificationsEnabled = v),
                  ),
                  if (_notificationsEnabled) ...[
                    _switchTile(
                      icon: Icons.email_rounded,
                      label: 'Email',
                      subtitle: 'Get updates via email',
                      isDark: isDark,
                      value: _emailNotifications,
                      onChanged: (v) => setState(() => _emailNotifications = v),
                    ),
                    _switchTile(
                      icon: Icons.phone_android_rounded,
                      label: 'Push Notifications',
                      subtitle: 'Instant alerts on device',
                      isDark: isDark,
                      value: _pushNotifications,
                      onChanged: (v) => setState(() => _pushNotifications = v),
                    ),
                  ],

                  const SizedBox(height: AppSpacing.xl),

                  // ── Appearance ──
                  _sectionLabel('Appearance', isDark),
                  _switchTile(
                    icon: Icons.dark_mode_rounded,
                    label: 'Dark Mode',
                    subtitle: 'Switch between light and dark',
                    isDark: isDark,
                    value: themeProvider.isDarkMode,
                    onChanged: (_) => themeProvider.toggleTheme(),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // ── Support ──
                  _sectionLabel('Support', isDark),
                  _tile(
                    icon: Icons.help_outline_rounded,
                    label: 'Help & FAQ',
                    subtitle: 'Common questions answered',
                    isDark: isDark,
                    onTap: () {},
                  ),
                  _tile(
                    icon: Icons.report_problem_outlined,
                    label: 'Reported Questions',
                    subtitle: 'Track your flagged items',
                    isDark: isDark,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ReportedQuestionsScreen()),
                    ),
                  ),
                  _tile(
                    icon: Icons.feedback_rounded,
                    label: 'Send Feedback',
                    subtitle: 'Help us improve the app',
                    isDark: isDark,
                    onTap: () {},
                  ),
                  _tile(
                    icon: Icons.info_outline_rounded,
                    label: 'About',
                    subtitle: 'Version 1.0.0',
                    isDark: isDark,
                    onTap: () {},
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // ── Logout ──
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _showLogoutDialog,
                      icon: const Icon(Icons.logout_rounded, size: 18),
                      label: const Text('Logout'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? const Color(0xFF2A1A1A) : Colors.red.shade50,
                        foregroundColor: Colors.redAccent,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                          side: const BorderSide(color: Colors.redAccent, width: 1.5),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.2,
          color: isDark ? Colors.white38 : AppColors.textSecondary,
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        border: Border.all(color: color.withOpacity(0.6), width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: color.withOpacity(0.9)),
      ),
    );
  }

  Widget _tile({
    required IconData icon,
    required String label,
    required String subtitle,
    required bool isDark,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF161F3D) : Colors.white,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade100, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black26 : Colors.grey.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primaryBlue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Icon(icon, color: AppColors.primaryBlue, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white38 : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            trailing ?? Icon(Icons.chevron_right_rounded, size: 20, color: isDark ? Colors.white24 : Colors.grey.shade400),
          ],
        ),
      ),
    );
  }

  Widget _switchTile({
    required IconData icon,
    required String label,
    required String subtitle,
    required bool isDark,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161F3D) : Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.grey.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(icon, color: AppColors.primaryBlue, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white38 : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primaryBlue,
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF161F3D) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
        title: const Text('Logout?', style: TextStyle(fontWeight: FontWeight.w900)),
        content: const Text('Are you sure you want to logout?', style: TextStyle(fontWeight: FontWeight.w500)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
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
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Logout', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────
// Profile / Account Detail Screen
// ─────────────────────────────────────────────────
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _currentPass;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final results = await Future.wait([
        apiService.getUserProfile(),
        apiService.get('/passes/current'),
      ]);

      if (mounted) {
        setState(() {
          _user = results[0] as Map<String, dynamic>?;
          if (results[1] is http.Response && (results[1] as http.Response).statusCode == 200 && (results[1] as http.Response).body.isNotEmpty) {
            _currentPass = jsonDecode((results[1] as http.Response).body);
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fullName = _user?['fullName'] ?? 'Guest User';
    final email = _user?['email'] ?? 'No email';
    final phone = _user?['phone'] ?? 'Not provided';
    final dob = _user?['dob'] ?? 'Not provided';
    final education = _user?['education'] ?? 'Not provided';
    final category = _user?['category'] ?? 'Not provided';
    final location = _user?['location'] ?? 'Not provided';
    final language = _user?['defaultLanguage'] ?? 'English';
    final role = _user?['role'] ?? 'STUDENT';
    final initial = fullName.isNotEmpty ? fullName[0].toUpperCase() : 'G';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0F1E) : const Color(0xFFF4F7FF),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Hero profile header
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1A3A8A), Color(0xFF2456C8), Color(0xFF3A7BD5)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(AppSpacing.radiusXl),
                    bottomRight: Radius.circular(AppSpacing.radiusXl),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.lg, AppSpacing.screenPadding, AppSpacing.xl),
                child: Column(
                  children: [
                    // Back + title row
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.18),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 18),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        const Text(
                          'My Profile',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // Avatar
                    Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.18),
                        border: Border.all(color: Colors.white.withOpacity(0.5), width: 3),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 16, offset: const Offset(0, 6))],
                      ),
                      child: Center(
                        child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w900)),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(fullName, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: _currentPass != null ? Colors.tealAccent.withOpacity(0.2) : Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        border: _currentPass != null ? Border.all(color: Colors.tealAccent.withOpacity(0.5)) : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_currentPass != null) ...[
                            const Icon(Icons.workspace_premium_rounded, color: Colors.tealAccent, size: 12),
                            const SizedBox(width: 4),
                          ],
                          Text(
                            _currentPass != null ? 'PREMIUM STUDENT' : role, 
                            style: TextStyle(
                              color: _currentPass != null ? Colors.tealAccent : Colors.white70, 
                              fontSize: 11, 
                              fontWeight: FontWeight.w900, 
                              letterSpacing: 0.8
                            )
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Info tiles
            SliverPadding(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _infoTile('Full Name', fullName, Icons.person_rounded, isDark),
                  _infoTile('Email', email, Icons.email_rounded, isDark),
                  _infoTile('Phone', phone, Icons.phone_rounded, isDark),
                  _infoTile('Date of Birth', dob, Icons.cake_rounded, isDark),
                  _infoTile('Education', education, Icons.school_rounded, isDark),
                  _infoTile('Category', category, Icons.category_rounded, isDark),
                  _infoTile('Location', location, Icons.location_on_rounded, isDark),
                  _infoTile('Language', language, Icons.language_rounded, isDark),
                  const SizedBox(height: AppSpacing.lg),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        if (_user == null) return;
                        final refresh = await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => EditProfileScreen(user: _user!)),
                        );
                        if (refresh == true) _fetchProfile();
                      },
                      icon: const Icon(Icons.edit_rounded, size: 18),
                      label: const Text('Edit Profile'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoTile(String label, String value, IconData icon, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161F3D) : Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.grey.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(icon, color: AppColors.primaryBlue, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? Colors.white38 : AppColors.textSecondary),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppColors.textPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
