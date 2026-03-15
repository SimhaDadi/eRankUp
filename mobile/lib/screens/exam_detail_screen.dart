import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../services/api_service.dart';
import '../models/chapter.dart';
import '../models/exam.dart';
import 'exam_start_screen.dart';
import 'test_engine_screen.dart';
import 'subscription_screen.dart';
import '../theme/app_theme.dart';

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
          _chapters = (data['chapters'] as List? ?? [])
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

  void _goToSubscriptions() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => SubscriptionScreen()),
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
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primaryCyan, AppColors.primaryCyan.withOpacity(0.8)],
                      ),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.stars, color: Colors.white, size: 32),
                        const SizedBox(height: 12),
                        const Text(
                          'PREMIUM EXAM',
                          style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.2),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Unlock this and 500+ other tests with a single pass.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _goToSubscriptions,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primaryCyan,
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          ),
                          child: const Text('VIEW ALL PLANS', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                Expanded(
                  child: _chapters.isEmpty && !_isLoading
                    ? Center(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.assignment_turned_in, color: AppColors.primaryBlue, size: 40),
                              ),
                              const SizedBox(height: 20),
                              const Text(
                                'Full Length Test',
                                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${_currentExam.totalQuestions ?? 0} Questions • ${_currentExam.duration ?? 0} Minutes',
                                style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 32),
                              SizedBox(
                                width: double.infinity,
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: canAccess ? () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => ExamStartScreen(
                                          model: TestModel.fromExam(_currentExam),
                                          parentMetadata: _currentExam.metadata,
                                        ),
                                      ),
                                    );
                                  } : _goToSubscriptions,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryBlue,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    elevation: 0,
                                  ),
                                  child: Text(
                                    canAccess ? 'START FULL TEST' : 'UNLOCK TEST SERIES',
                                    style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
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
                                  style: TextStyle(
                                    fontSize: 16, 
                                    fontWeight: FontWeight.bold, 
                                    color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF60A5FA) : Colors.blue.shade700
                                  ),
                                ),
                              ),
                              ...chapter.models.map((model) => Card(
                                    margin: const EdgeInsets.only(bottom: 8),
                                color: canAccess ? null : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155).withValues(alpha: 0.5) : Colors.grey.withValues(alpha: 0.1)),
                                child: ListTile(
                                  title: Text(model.title, style: TextStyle(color: canAccess ? null : (Theme.of(context).brightness == Brightness.dark ? Colors.white24 : Colors.grey))),
                                  subtitle: Text('${model.totalQuestions} Questions'),
                                  trailing: !canAccess 
                                    ? Icon(Icons.lock, color: Theme.of(context).brightness == Brightness.dark ? Colors.white24 : Colors.grey)
                                    : (model.isLive 
                                        ? const Icon(Icons.play_arrow, color: Colors.green)
                                        : Icon(Icons.lock_clock, color: Theme.of(context).brightness == Brightness.dark ? Colors.amberAccent : Colors.amber)),
                                      onTap: (canAccess && model.isLive) ? () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => ExamStartScreen(
                                              model: model,
                                              parentMetadata: _currentExam.metadata,
                                            ),
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
