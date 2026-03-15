import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../services/api_service.dart';
import '../models/pass.dart';
import '../theme/app_theme.dart';
import 'edit_profile_screen.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  late Razorpay _razorpay;
  List<Pass> _passes = [];
  Map<String, dynamic>? _activePass;
  bool _isLoading = true;
  bool _isTrialAvailable = true;
  bool _hasPhone = true;
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _fetchData();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    try {
      final results = await Future.wait([
        apiService.get('/passes'),
        apiService.get('/passes/current'),
        apiService.get('/passes/eligibility'),
        apiService.getUserProfile(),
      ]);

      if (mounted) {
        setState(() {
          final passesRes = results[0] as http.Response;
          final currentPassRes = results[1] as http.Response;
          final eligibilityRes = results[2] as http.Response;
          _user = results[3] as Map<String, dynamic>?;

          if (passesRes.statusCode == 200) {
            final List<dynamic> data = jsonDecode(passesRes.body);
            _passes = data.map((e) => Pass.fromJson(e)).toList();
          }
          if (currentPassRes.statusCode == 200 && currentPassRes.body.isNotEmpty) {
            _activePass = jsonDecode(currentPassRes.body);
          }
          if (eligibilityRes.statusCode == 200) {
            final eligibility = jsonDecode(eligibilityRes.body);
            _isTrialAvailable = eligibility['isTrialAvailable'] ?? true;
            _hasPhone = eligibility['hasPhone'] ?? true;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching subscription data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final verifyRes = await apiService.post('/passes/verify-payment', {
        'razorpayOrderId': response.orderId,
        'razorpayPaymentId': response.paymentId,
        'razorpaySignature': response.signature,
      });

      if (verifyRes.statusCode == 201 || verifyRes.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Purchase successful! Your pass is now active.')),
          );
          _fetchData(); // Refresh data
        }
      }
    } catch (e) {
      debugPrint('Error verifying payment: $e');
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Payment Failed: ${response.message}')),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External Wallet: ${response.walletName}')),
    );
  }

  Future<void> _initiatePurchase(Pass pass) async {
    // Show coupon dialog first if it's not a free trial
    String? couponCode;
    if ((double.tryParse(pass.price) ?? 0) > 0) {
      couponCode = await _showCouponDialog();
    }

    final apiService = Provider.of<ApiService>(context, listen: false);
    final userProfile = await apiService.getUserProfile();

    try {
      final payload = {'passId': pass.id};
      
      // Check for phone number if it's a free trial
      if ((double.tryParse(pass.price) ?? 0) == 0 && !_hasPhone) {
        if (mounted) {
          _showPhoneRequiredDialog();
        }
        return;
      }

      if (couponCode != null && couponCode.isNotEmpty) {
        payload['couponCode'] = couponCode;
      }

      final response = await apiService.post('/passes/create-order', payload);
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['isFree'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Free trial activated successfully!')),
          );
          _fetchData();
          return;
        }

        // Show discount if applied
        if (data['discountApplied'] != null && data['discountApplied'] > 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🎉 Discount Applied: ₹${data['discountApplied']} off!'),
              backgroundColor: Colors.green,
            ),
          );
        }

        var options = {
          'key': data['keyId'],
          'amount': data['amount'],
          'name': 'eRankUp',
          'order_id': data['orderId'] ?? data['id'],
          'description': 'Purchase ${pass.title}',
          'prefill': {
            'contact': '', // Can fetch from profile
            'email': userProfile?['email'] ?? '',
          },
          'theme': {'color': '#00BFA5'}
        };

        _razorpay.open(options);
      } else {
        final error = jsonDecode(response.body);
        final errorMsg = error['message'] ?? 'Failed to initiate purchase';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMsg), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      debugPrint('Error initiating purchase: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<String?> _showCouponDialog() async {
    final controller = TextEditingController();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return showDialog<String>(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusXl)),
        elevation: 10,
        backgroundColor: theme.dialogTheme.backgroundColor ?? theme.scaffoldBackgroundColor,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: AppColors.primaryCyan.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.local_offer, color: AppColors.primaryCyan, size: 32),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('Have a Coupon?', style: AppTextStyles.h2),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Enter your code below to get a discount on your purchase.',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xl),
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: 'COUPONCODE',
                  hintStyle: TextStyle(color: isDark ? Colors.white24 : AppColors.textTertiary.withOpacity(0.5)),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E293B) : AppColors.bgSecondary,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                ),
                textCapitalization: TextCapitalization.characters,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold, 
                  letterSpacing: 2, 
                  color: theme.textTheme.bodyLarge?.color
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context, null),
                      child: Text('SKIP', style: TextStyle(color: AppColors.textTertiary, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, controller.text.trim()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryCyan,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusMd)),
                      ),
                      child: const Text('APPLY', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPhoneRequiredDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Phone Number Required'),
        content: const Text(
            'To claim your free trial, please add your mobile number in your profile settings. This helps us ensure one trial per user.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context, 
                MaterialPageRoute(builder: (_) => EditProfileScreen(user: _user ?? {}))
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryCyan,
              foregroundColor: Colors.white,
            ),
            child: const Text('GO TO PROFILE', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Plans & Subscriptions'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppSpacing.screenPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_activePass != null) _buildActivePassCard(),
                    const SizedBox(height: AppSpacing.xxl),
                    const Text('Available Plans', style: AppTextStyles.h2),
                    const SizedBox(height: 16),
                    ..._passes.map((p) => _buildPassCard(p)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildActivePassCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.premiumGradient,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        boxShadow: AppShadows.medium,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.stars, color: Colors.white, size: 28),
              SizedBox(width: 12),
              Text('ACTIVE PASS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
            ],
          ),
          const SizedBox(height: 20),
          Text(_activePass!['pass']['title'], style: AppTextStyles.h1.copyWith(color: Colors.white)),
          const SizedBox(height: 8),
          Text(
            'Valid until ${DateTime.parse(_activePass!['expiresAt']).toLocal().toString().split(' ')[0]}',
            style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildPassCard(Pass pass) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        border: Border.all(
          color: pass.isPopular 
            ? AppColors.primaryCyan 
            : (isDark ? const Color(0xFF334155) : Colors.grey.shade100), 
          width: 2
        ),
        boxShadow: isDark ? [] : AppShadows.small,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (pass.isPopular)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryCyan.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('MOST POPULAR', style: TextStyle(color: AppColors.primaryCyan, fontSize: 10, fontWeight: FontWeight.w900)),
            ),
          Text(pass.title, style: AppTextStyles.h2),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('₹${pass.price}', style: AppTextStyles.h1.copyWith(color: AppColors.primaryCyan, fontSize: 32)),
              const SizedBox(width: 8),
              if ((double.tryParse(pass.price) ?? 0) > 0)
                Text('/ ${pass.durationDays} days', style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Text(pass.description, style: AppTextStyles.bodySmall),
          const SizedBox(height: 20),
          ...pass.features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.primaryCyan, size: 18),
                    const SizedBox(width: 12),
                    Expanded(child: Text(f, style: AppTextStyles.bodySmall.copyWith(color: theme.textTheme.bodyMedium?.color, fontWeight: FontWeight.bold))),
                  ],
                ),
              )),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (double.tryParse(pass.price) ?? 0) == 0 && !_isTrialAvailable 
                ? null 
                : () => _initiatePurchase(pass),
              style: ElevatedButton.styleFrom(
                backgroundColor: pass.isPopular ? AppColors.primaryCyan : (isDark ? const Color(0xFF1E293B) : AppColors.darkNavy),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                disabledBackgroundColor: Colors.grey.withOpacity(0.3),
              ),
              child: Text(
                (double.tryParse(pass.price) ?? 0) == 0 
                  ? (_isTrialAvailable ? 'START FREE TRIAL' : 'TRIAL ALREADY CLAIMED') 
                  : 'GET ACCESS NOW'
              ),
            ),
          ),
        ],
      ),
    );
  }
}
