import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/haptic_service.dart';
import '../theme/app_theme.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const EditProfileScreen({super.key, required this.user});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _dobController;
  late TextEditingController _educationController;
  late TextEditingController _locationController;
  
  String? _selectedCategory;
  String? _selectedLanguage;
  
  bool _isLoading = false;

  final List<String> _categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  final List<String> _languages = ['English', 'Hindi', 'Marathi', 'Telugu'];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user['fullName']);
    _phoneController = TextEditingController(text: widget.user['phone'] ?? '');
    _dobController = TextEditingController(text: widget.user['dob'] ?? '');
    _educationController = TextEditingController(text: widget.user['education'] ?? '');
    _locationController = TextEditingController(text: widget.user['location'] ?? '');
    
    _selectedCategory = widget.user['category'];
    _selectedLanguage = widget.user['defaultLanguage'] ?? 'English';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _educationController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);

    try {
      final success = await apiService.updateProfile({
        'fullName': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'dob': _dobController.text.trim().isNotEmpty ? _dobController.text.trim() : null,
        'education': _educationController.text.trim(),
        'category': _selectedCategory,
        'location': _locationController.text.trim(),
        'defaultLanguage': _selectedLanguage,
      });

      if (success && mounted) {
        HapticService.success();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully!')),
        );
        Navigator.pop(context, true);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update profile. Please try again.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    DateTime initialDate = DateTime.now().subtract(const Duration(days: 365 * 18));
    if (_dobController.text.isNotEmpty) {
      try {
        initialDate = DateTime.parse(_dobController.text);
      } catch (_) {}
    }

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primaryBlue,
              onPrimary: Colors.white,
              onSurface: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _dobController.text = picked.toIso8601String().split('T')[0];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        elevation: 0,
        actions: [
          if (!_isLoading)
            TextButton(
              onPressed: _handleSave,
              child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Personal Information',
                style: AppTextStyles.h3.copyWith(color: theme.colorScheme.primary),
              ),
              const SizedBox(height: 8),
              Text(
                'Update your profile details to keep your account in sync.',
                style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white60 : Colors.grey.shade600),
              ),
              const SizedBox(height: 32),
              
              _buildFieldHeader('Full Name'),
              TextFormField(
                controller: _nameController,
                decoration: _buildInputDecoration('Enter your full name', Icons.person_outline),
                keyboardType: TextInputType.name,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Please enter your name';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              
              _buildFieldHeader('Phone Number'),
              TextFormField(
                controller: _phoneController,
                decoration: _buildInputDecoration('Enter your phone number', Icons.phone_outlined),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 20),

              _buildFieldHeader('Date of Birth'),
              GestureDetector(
                onTap: () => _selectDate(context),
                child: AbsorbPointer(
                  child: TextFormField(
                    controller: _dobController,
                    decoration: _buildInputDecoration('Select your birth date', Icons.calendar_today_outlined),
                    validator: (value) {
                      if (value != null && value.isNotEmpty) {
                        try {
                          DateTime.parse(value);
                        } catch (e) {
                          return 'Invalid date format (YYYY-MM-DD)';
                        }
                      }
                      return null;
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),

              _buildFieldHeader('Education'),
              TextFormField(
                controller: _educationController,
                decoration: _buildInputDecoration('Your educational background', Icons.school_outlined),
              ),
              const SizedBox(height: 20),

              _buildFieldHeader('Category'),
              DropdownButtonFormField<String>(
                value: _categories.contains(_selectedCategory) ? _selectedCategory : null,
                isExpanded: true,
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                menuMaxHeight: 350,
                alignment: AlignmentDirectional.centerStart,
                icon: Icon(Icons.keyboard_arrow_down_rounded, color: isDark ? Colors.white54 : Colors.grey.shade400),
                decoration: _buildInputDecoration('Select Category', Icons.tag_outlined),
                items: _categories.map((c) => DropdownMenuItem(
                  value: c, 
                  child: Text(c, style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 15)),
                )).toList(),
                onChanged: (val) => setState(() => _selectedCategory = val),
              ),
              const SizedBox(height: 20),

              _buildFieldHeader('Location'),
              TextFormField(
                controller: _locationController,
                decoration: _buildInputDecoration('Your current city/region', Icons.location_on_outlined),
              ),
              const SizedBox(height: 20),

              _buildFieldHeader('Default Language'),
              DropdownButtonFormField<String>(
                value: _selectedLanguage,
                isExpanded: true,
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                menuMaxHeight: 350,
                alignment: AlignmentDirectional.centerStart,
                icon: Icon(Icons.keyboard_arrow_down_rounded, color: isDark ? Colors.white54 : Colors.grey.shade400),
                decoration: _buildInputDecoration('Select Language', Icons.translate_outlined),
                items: _languages.map((l) => DropdownMenuItem(
                  value: l, 
                  child: Text(l, style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 15)),
                )).toList(),
                onChanged: (val) => setState(() => _selectedLanguage = val),
              ),
              
              const SizedBox(height: 48),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFieldHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        label,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String hint, IconData icon) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, size: 20),
      filled: true,
      fillColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
      ),
    );
  }
}
