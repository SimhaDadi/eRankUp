import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../services/api_service.dart';
import '../models/pass.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';

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
      ]);

      if (mounted) {
        setState(() {
          if (results[0].statusCode == 200) {
            final List<dynamic> data = jsonDecode(results[0].body);
            _passes = data.map((e) => Pass.fromJson(e)).toList();
          }
          if (results[1].statusCode == 200 && results[1].body.isNotEmpty) {
            _activePass = jsonDecode(results[1].body);
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
    if (int.parse(pass.price) > 0) {
      couponCode = await _showCouponDialog();
    }

    final apiService = Provider.of<ApiService>(context, listen: false);
    final userProfile = await apiService.getUserProfile();

    try {
      final payload = {'passId': pass.id};
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
      }
    } catch (e) {
      debugPrint('Error initiating purchase: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString().contains('Invalid Coupon') ? e.toString() : 'Failed to initiate purchase. Please try again.'}')),
      );
    }
  }

  Future<String?> _showCouponDialog() async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Have a Coupon Code?'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Enter coupon code (optional)',
            border: OutlineInputBorder(),
          ),
          textCapitalization: TextCapitalization.characters,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, null),
            child: const Text('Skip'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Apply'),
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
              Text('ACTIVE PASS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.black, letterSpacing: 1.2)),
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
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        border: Border.all(color: pass.isPopular ? AppColors.primaryCyan : Colors.grey.shade100, width: 2),
        boxShadow: AppShadows.small,
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
              child: const Text('MOST POPULAR', style: TextStyle(color: AppColors.primaryCyan, fontSize: 10, fontWeight: FontWeight.black)),
            ),
          Text(pass.title, style: AppTextStyles.h2),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('₹${pass.price}', style: AppTextStyles.h1.copyWith(color: AppColors.primaryCyan, fontSize: 32)),
              const SizedBox(width: 8),
              if (int.parse(pass.price) > 0)
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
                    Expanded(child: Text(f, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold))),
                  ],
                ),
              )),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _initiatePurchase(pass),
              style: ElevatedButton.styleFrom(
                backgroundColor: pass.isPopular ? AppColors.primaryCyan : AppColors.darkNavy,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(int.parse(pass.price) == 0 ? 'START FREE TRIAL' : 'GET ACCESS NOW'),
            ),
          ),
        ],
      ),
    );
  }
}
