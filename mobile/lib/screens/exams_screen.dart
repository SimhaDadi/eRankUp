import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/exam.dart';
import '../theme/app_theme.dart';
import 'exam_detail_screen.dart';
import 'results_screen.dart';

class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});

  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen> with TickerProviderStateMixin {
  List<Exam> _allExams = [];
  List<Exam> _filteredExams = [];
  bool _isLoading = true;
  String _searchQuery = '';
  late TabController _tabController;
  
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      _applyFilters();
    });
    _fetchExams();
  }

  // ... (dispose remains same)

  Future<void> _fetchExams() async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      // Fetch all list variations concurrently or just fetch 'all' and filter client side?
      // Since backend supports filtering, let's fetch all generic exams first.
      // But we want everything to filter locally as per _applyFilters logic.
      final response = await api.get('/exams?type=all'); // Use 'all' or empty type to get everything if supported

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _allExams = data.map((json) => Exam.fromJson(json)).toList();
          _isLoading = false;
        });
        _applyFilters();
      } else {
        throw Exception('Failed to load exams');
      }
    } catch (e) {
      print('Error fetching exams: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading exams: $e')),
        );
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredExams = _allExams.where((exam) {
        if (_searchQuery.isNotEmpty) {
          final query = _searchQuery.toLowerCase();
          if (!exam.title.toLowerCase().contains(query) &&
              !exam.description.toLowerCase().contains(query)) {
            return false;
          }
        }

        // Strict filtering: Only show published exams
        if (!exam.isPublished) return false;

        String typeFilter = 'all';
        bool isFreeQuiz = false;

        switch (_tabController.index) {
          case 1: typeFilter = 'real_exam'; break; // Mock Tests
          case 2: typeFilter = 'previous_year_paper'; break; // PYPs
          case 3: typeFilter = 'question_bank'; break; // Banks
          case 4: isFreeQuiz = true; break; // Daily Quizzes
        }

        if (isFreeQuiz) {
          // Special handling for Daily Quizzes tab
          return exam.category == 'Free Quiz';
        }

        if (typeFilter != 'all') {
          // Standard type filtering
          if (exam.type != typeFilter) return false;
          // IMPORTANT: Exclude "Free Quiz" category items from "Mock Tests" (real_exam) to avoid duplication/clutter
          if (typeFilter == 'real_exam' && exam.category == 'Free Quiz') return false;
        } else {
             // In "All" tab, maybe show everything? Or keep Free Quizzes separate?
             // Let's keep them in "All" for visibility, or filter if deemed too cluttered.
             // For now, "All" shows everything.
        }

        return true;
      }).toList();
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      _applyFilters();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.screenPadding, AppSpacing.screenPadding, 0),
              child: Row(
                children: [
                  Text('Test Series', style: AppTextStyles.h1.copyWith(color: Theme.of(context).textTheme.displayLarge?.color)),
                ],
              ),
            ),

            // Tab Bar
            TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              indicatorColor: AppColors.primaryBlue,
              labelColor: AppColors.primaryBlue,
              unselectedLabelColor: AppColors.textTertiary,
              tabs: const [
                Tab(text: 'All'),
                Tab(text: 'Mock Tests'),
                Tab(text: 'PYPs'),
                Tab(text: 'Banks'),
                Tab(text: 'Daily Quizzes'),
              ],
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenPadding,
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search exams...',
                  hintStyle: AppTextStyles.body.copyWith(
                    color: AppColors.textTertiary,
                  ),
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : AppColors.bgTertiary,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Results Count
            if (!_isLoading)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.screenPadding,
                ),
                child: Row(
                  children: [
                    Text(
                      '${_filteredExams.length} ${_filteredExams.length == 1 ? 'exam' : 'exams'} found',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: AppSpacing.md),
            
            // Exam List
            Expanded(
              child: _isLoading
                  ? _buildLoadingState()
                  : _filteredExams.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _fetchExams,
                          color: AppColors.primaryBlue,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.screenPadding,
                            ),
                            itemCount: _filteredExams.length,
                            itemBuilder: (context, index) {
                              return _buildEnhancedExamCard(
                                _filteredExams[index],
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          height: 180,
          margin: const EdgeInsets.only(bottom: AppSpacing.lg),
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'No exams found',
              style: AppTextStyles.h3.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Try adjusting your search or filters',
              style: AppTextStyles.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            OutlinedButton(
              onPressed: () {
                _searchController.clear();
                _tabController.index = 0;
                _onSearchChanged('');
              },
              child: const Text('Clear Filters'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedExamCard(Exam exam) {
    final gradientColors = _getGradientColors(exam.title);
    
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          onTap: () {
            if (exam.attempts != null && (exam.attempts!['count'] ?? 0) > 0) {
                 Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ResultsScreen(attemptId: exam.attempts!['latestAttemptId']),
                    ),
                  );
            } else {
              Navigator.push(
                context,
                PageRouteBuilder(
                  pageBuilder: (context, animation, secondaryAnimation) =>
                      ExamDetailScreen(exam: exam),
                  transitionsBuilder: (context, animation, secondaryAnimation, child) {
                    const begin = Offset(1.0, 0.0);
                    const end = Offset.zero;
                    const curve = Curves.easeInOutCubic;
                    
                    var tween = Tween(begin: begin, end: end)
                        .chain(CurveTween(curve: curve));
                    var offsetAnimation = animation.drive(tween);
                    
                    return SlideTransition(
                      position: offsetAnimation,
                      child: child,
                    );
                  },
                  transitionDuration: const Duration(milliseconds: 300),
                ),
              );
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        ),
                        child: Icon(
                          _getCategoryIcon(exam.title),
                          color: Colors.white,
                          size: AppSpacing.iconLg,
                        ),
                      ),
                      const Spacer(),
                      if (exam.attempts != null && (exam.attempts!['count'] ?? 0) > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, color: Colors.green, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                "ATTEMPTED",
                                style: TextStyle(
                                  fontSize: 10, 
                                  fontWeight: FontWeight.bold, 
                                  color: Colors.green.shade700
                                )
                              )
                            ],
                          )
                        )
                      else if (exam.isPremium)
                        const Icon(
                          Icons.workspace_premium,
                          color: Colors.amber,
                          size: 24,
                        ),
                    ],
                  ),
                const SizedBox(height: AppSpacing.lg),
                
                // Title
                Text(
                  exam.title,
                  style: AppTextStyles.h3.copyWith(
                    color: Colors.white,
                    shadows: [
                      const Shadow(
                        color: Colors.black26,
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                
                // Description
                Text(
                  exam.description,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: Colors.white70,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.lg),
                
                // Stats Row
                Row(
                  children: [
                    _buildStat(Icons.quiz, '${exam.totalQuestions ?? 0} Qs'),
                    const SizedBox(width: AppSpacing.lg),
                    _buildStat(Icons.timer, '${exam.duration ?? 0} min'),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStat(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            text,
            style: AppTextStyles.caption.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  List<Color> _getGradientColors(String title) {
    // Vibrant modern gradients
    final hash = title.hashCode.abs();
    final gradients = [
      [const Color(0xFF4F46E5), const Color(0xFF7C3AED)], // Indigo to Violet
      [const Color(0xFF2563EB), const Color(0xFF06B6D4)], // Blue to Cyan
      [const Color(0xFF059669), const Color(0xFF34D399)], // Emerald to Teal
      [const Color(0xFFDC2626), const Color(0xFFF59E0B)], // Red to Amber
      [const Color(0xFFDB2777), const Color(0xFFF472B6)], // Pink to Rose
      [const Color(0xFFea580c), const Color(0xFFfb923c)], // Orange
    ];
    
    return gradients[hash % gradients.length];
  }

  IconData _getCategoryIcon(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('ssc')) return Icons.school;
    if (lower.contains('bank')) return Icons.account_balance;
    if (lower.contains('railway') || lower.contains('rrb')) return Icons.train;
    if (lower.contains('upsc')) return Icons.gavel;
    return Icons.quiz;
  }
}
