import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../services/api_service.dart';
import '../models/chapter.dart';
import '../models/exam.dart';
import 'test_engine_screen.dart';

class ExamDetailScreen extends StatefulWidget {
  final Exam exam;
  const ExamDetailScreen({super.key, required this.exam});

  @override
  State<ExamDetailScreen> createState() => _ExamDetailScreenState();
}

class _ExamDetailScreenState extends State<ExamDetailScreen> {
  List<Chapter> _chapters = [];
  bool _isLoading = true;
  late Razorpay _razorpay;
  late Exam _currentExam;

  @override
  void initState() {
    super.initState();
    _currentExam = widget.exam;
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _fetchDetails();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    Fluttertoast.showToast(msg: "Payment Successful!");
    _fetchDetails(); // Reload to update purchase status
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    Fluttertoast.showToast(msg: "Payment Failed: ${response.message}");
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    Fluttertoast.showToast(msg: "External Wallet: ${response.walletName}");
  }

  Future<void> _fetchDetails() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/exams/${widget.exam.id}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _currentExam = Exam.fromJson(data);
          _chapters = (data['chapters'] as List)
              .map((c) => Chapter.fromJson(c))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _startPayment() async {
    // Show coupon dialog first
    String? couponCode = await _showCouponDialog();
    
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final payload = {'examId': _currentExam.id};
      if (couponCode != null && couponCode.isNotEmpty) {
        payload['couponCode'] = couponCode;
      }

      final response = await apiService.post('/payments/create-order', payload);
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Show discount if applied
        if (data['discountApplied'] != null && data['discountApplied'] > 0) {
          Fluttertoast.showToast(
            msg: "🎉 Discount Applied: ₹${data['discountApplied']} off!",
            backgroundColor: Colors.green,
          );
        }
        
        var options = {
          'key': data['keyId'],
          'amount': data['amount'],
          'name': 'eRankUp',
          'order_id': data['orderId'],
          'description': 'Premium Exam Access',
          'timeout': 300, // in seconds
          'prefill': {
            'contact': '', // Can be added to user profile later
            'email': data['user']['email']
          },
          'theme': {'color': '#2563EB'}
        };
        
        _razorpay.open(options);
      } else {
        Fluttertoast.showToast(msg: "Failed to create order");
      }
    } catch (e) {
      final errorMsg = e.toString().contains('Invalid Coupon') 
        ? e.toString() 
        : "Error: $e";
      Fluttertoast.showToast(msg: errorMsg, backgroundColor: Colors.red);
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
    bool canAccess = !_currentExam.isPremium || _currentExam.hasPurchased;

    return Scaffold(
      appBar: AppBar(title: Text(_currentExam.title)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_currentExam.isPremium && !_currentExam.hasPurchased)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: Colors.amber.withOpacity(0.1),
                    child: Column(
                      children: [
                        const Text(
                          'This is a Premium Exam',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _startPayment,
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.amber),
                          child: Text('Unlock for ₹${_currentExam.price}', style: const TextStyle(color: Colors.black)),
                        ),
                      ],
                    ),
                  ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _chapters.length,
                    itemBuilder: (context, index) {
                      final chapter = _chapters[index];
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: Text(
                              chapter.title,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueAccent),
                            ),
                          ),
                          ...chapter.models.map((model) => Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                color: canAccess ? null : Colors.grey.withOpacity(0.1),
                                child: ListTile(
                                  title: Text(model.title, style: TextStyle(color: canAccess ? null : Colors.grey)),
                                  subtitle: Text('${model.totalQuestions} Questions'),
                                  trailing: !canAccess 
                                    ? const Icon(Icons.lock, color: Colors.grey)
                                    : (model.isLive 
                                        ? const Icon(Icons.play_arrow, color: Colors.emerald)
                                        : const Icon(Icons.lock_clock, color: Colors.amber)),
                                  onTap: (canAccess && model.isLive) ? () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => TestEngineScreen(model: model),
                                      ),
                                    );
                                  } : null,
                                ),
                              )),
                          const SizedBox(height: 16),
                        ],
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
