import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/exam.dart';
import '../theme/app_theme.dart';
import 'exam_detail_screen.dart';

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
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      _applyFilters();
    });
    _fetchExams();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchExams() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    try {
      final response = await apiService.get('/exams');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _allExams = data.map((e) => Exam.fromJson(e)).toList();
          _applyFilters();
        });
      }
    } catch (e) {
      debugPrint('Error fetching exams: $e');
    } finally {
      setState(() => _isLoading = false);
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

        String typeFilter = 'all';
        switch (_tabController.index) {
          case 1: typeFilter = 'real_exam'; break;
          case 2: typeFilter = 'previous_year_paper'; break;
          case 3: typeFilter = 'question_bank'; break;
        }

        if (typeFilter != 'all' && exam.type != typeFilter) return false;

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
                _setFilter('all');
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
                    if (exam.isPremium)
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
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white70),
        const SizedBox(width: 4),
        Text(
          text,
          style: AppTextStyles.caption.copyWith(
            color: Colors.white70,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  List<Color> _getGradientColors(String title) {
    // Simple hash-based color selection for variety
    final hash = title.hashCode.abs();
    final gradients = [
      [const Color(0xFF2563EB), const Color(0xFF00BFA5)], // Blue to Cyan
      [const Color(0xFF7C3AED), const Color(0xFF2563EB)], // Purple to Blue
      [const Color(0xFFEF4444), const Color(0xFFF59E0B)], // Red to Amber
      [const Color(0xFF10B981), const Color(0xFF059669)], // Green to Teal
      [const Color(0xFFF59E0B), const Color(0xFFEF4444)], // Amber to Red
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
