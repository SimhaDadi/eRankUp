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

class _ExamsScreenState extends State<ExamsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Exam> _allExams = [];
  List<Exam> _filteredExams = [];
  bool _isLoading = true;
  String _searchQuery = '';
  
  int _page = 1;
  final int _limit = 10;
  bool _hasMore = true;
  bool _isLoadMoreRunning = false;
  String _currentType = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _tabController.addListener(_onTabChanged);
    _scrollController.addListener(_onScroll);
    _fetchExams();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _scrollController.dispose();
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    
    // Map tab to type
    String newType = 'all';
    switch (_tabController.index) {
        case 0: newType = 'all'; break;
        case 1: newType = 'real_exam'; break;
        case 2: newType = 'previous_year_paper'; break;
        case 3: newType = 'question_bank'; break;
        case 4: newType = 'chapter_wise_test'; break;
        case 5: newType = 'all'; break; // Daily Quiz handled by filtering later
    }
    
    // If Daily Quiz (index 5), we might still fetch 'all' and filter.
    if (_currentType != newType || _tabController.index == 5) {
        setState(() {
            _currentType = newType;
            _searchController.clear();
            _searchQuery = '';
        });
        _fetchExams(refresh: true);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent &&
        !_isLoading &&
        !_isLoadMoreRunning &&
        _hasMore) {
      _fetchExams(loadMore: true);
    }
  }

  Future<void> _fetchExams({bool refresh = false, bool loadMore = false}) async {
    if (refresh) {
      setState(() {
        _isLoading = true;
        _page = 1;
        _hasMore = true;
        _allExams = [];
        _filteredExams = [];
      });
    } else if (loadMore) {
      setState(() {
        _isLoadMoreRunning = true;
      });
    }

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      // Construct URL with pagination and type
      String url = '/exams?page=$_page&limit=$_limit';
      if (_currentType != 'all') {
          url += '&type=$_currentType';
      }
      
      // Note: Daily Quiz logic is client-side filter on 'all' or we need backend support.
      // Keeping 'all' for now if specific type missing.

      final response = await api.get(url);

      if (response.statusCode == 200) {
        final dynamic jsonResponse = jsonDecode(response.body);
        List<Exam> newExams = [];
        int total = 0;

        // Handle both paginated and legacy responses for robustness
        if (jsonResponse is Map<String, dynamic> && jsonResponse.containsKey('data')) {
            newExams = (jsonResponse['data'] as List).map((json) => Exam.fromJson(json)).toList();
            total = jsonResponse['meta']['total'];
        } else if (jsonResponse is List) {
            // Legacy fallback
            newExams = jsonResponse.map((json) => Exam.fromJson(json)).toList();
            total = newExams.length; // Can't really know total, assume this is all
            _hasMore = false; // Disable infinite scroll if legacy
        }

        if (mounted) {
          setState(() {
            if (refresh) {
                _allExams = newExams;
            } else {
                _allExams.addAll(newExams);
            }
            
            // Check if we have loaded all available items
            // If strict pagination: _allExams.length < total
            // Or simple check: if newExams.length < _limit
            if (newExams.length < _limit) {
                _hasMore = false;
            } else {
                _page++;
            }
            
            _isLoading = false;
            _isLoadMoreRunning = false;
          });
          _applyFilters();
        }
      } else {
        throw Exception('Failed to load exams');
      }
    } catch (e) {
      print('Error fetching exams: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadMoreRunning = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading exams: $e')),
        );
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredExams = _allExams.where((exam) {
        // Search Filter
        if (_searchQuery.isNotEmpty) {
          final query = _searchQuery.toLowerCase();
          if (!exam.title.toLowerCase().contains(query) &&
              !exam.description.toLowerCase().contains(query)) {
            return false;
          }
        }

        // Strict filtering: Only show published exams
        if (!exam.isPublished) return false;

        // Tab specific filtering (Client Side refinement)
        // Since we now check type on server, we mostly just handle special cases here
        
        if (_tabController.index == 5) {
           // Daily Quizzes
           return exam.category == 'Free Quiz' || exam.category == 'Quiz';
        }

        if (_tabController.index == 1) {
             // Mock Tests - Exclude free quizzes
             if (exam.category == 'Free Quiz' || exam.category == 'Quiz') return false;
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0F1E) : const Color(0xFFF4F7FF),
      body: SafeArea(
        child: Column(
          children: [
            // Premium Hero Banner
            _buildHeroBanner(isDark),

            // Styled Pill TabBar
            Container(
              color: isDark ? const Color(0xFF0A0F1E) : const Color(0xFFF4F7FF),
              child: TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                dividerColor: Colors.transparent,
                indicatorSize: TabBarIndicatorSize.tab,
                indicator: BoxDecoration(
                  color: AppColors.primaryBlue,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                ),
                labelColor: Colors.white,
                unselectedLabelColor: isDark ? Colors.white54 : AppColors.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                tabs: const [
                  Tab(text: 'All'),
                  Tab(text: 'Mock Tests'),
                  Tab(text: 'PYPs'),
                  Tab(text: 'Banks'),
                  Tab(text: 'Chapter Tests'),
                  Tab(text: 'Daily Quizzes'),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

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
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                  prefixIcon: const Icon(Icons.search, color: AppColors.primaryBlue),
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
                  fillColor: Theme.of(context).brightness == Brightness.dark 
                      ? const Color(0xFF1E293B) 
                      : Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: BorderSide(color: AppColors.divider.withOpacity(0.5)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: BorderSide(color: AppColors.divider.withOpacity(0.3)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                ),
                style: AppTextStyles.body.copyWith(
                  color: Theme.of(context).brightness == Brightness.dark ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.sm),

            // Results Count
            if (!_isLoading)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.screenPadding,
                ),
                child: Row(
                  children: [
                    Text(
                      '${_filteredExams.length} ${_filteredExams.length == 1 ? 'exam' : 'exams'} loaded',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const Spacer(),
                    // Swipe hint (shown briefly)
                    Row(
                      children: const [
                        Icon(Icons.swipe, size: 14, color: AppColors.textSecondary),
                        SizedBox(width: 4),
                        Text('Swipe to switch tabs', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: AppSpacing.sm),
            
            // Swipeable Exam List — TabBarView synced with TabController
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: List.generate(6, (_) => _buildExamListContent()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Shared list content — data is updated by _onTabChanged via controller listener
  Widget _buildExamListContent() {
    if (_isLoading) return _buildLoadingState();
    if (_filteredExams.isEmpty && !_isLoadMoreRunning) return _buildEmptyState();

    return RefreshIndicator(
      onRefresh: () => _fetchExams(refresh: true),
      color: AppColors.primaryBlue,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPadding,
        ),
        itemCount: _filteredExams.length + (_isLoadMoreRunning ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _filteredExams.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _buildEnhancedExamCard(_filteredExams[index]);
        },
      ),
    );
  }


  Widget _buildHeroBanner(bool isDark) {
    return Container(
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.quiz_rounded, color: Colors.white, size: 12),
                    SizedBox(width: 5),
                    Text(
                      'TEST SERIES',
                      style: TextStyle(
                        color: Colors.white, fontSize: 10,
                        fontWeight: FontWeight.w900, letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Live count badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                ),
                child: Text(
                  '${_filteredExams.length} Exams',
                  style: const TextStyle(
                    color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Text(
            'Test Your Knowledge',
            style: TextStyle(
              color: Colors.white, fontSize: 24,
              fontWeight: FontWeight.w900, letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Mock Tests • PYPs • Chapter-wise Practice',
            style: TextStyle(
              color: Colors.white70, fontSize: 13, height: 1.5, fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding, vertical: AppSpacing.sm),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          height: 200,
          margin: const EdgeInsets.only(bottom: AppSpacing.lg),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isDark
                  ? [const Color(0xFF1E293B), const Color(0xFF161F3D)]
                  : [Colors.grey.shade200, Colors.grey.shade100],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90, height: 90,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A3A8A), Color(0xFF3A7BD5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(child: Text('📋', style: TextStyle(fontSize: 44))),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'No Exams Found',
              style: AppTextStyles.h3.copyWith(
                color: isDark ? Colors.white : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Try adjusting your search or switch tabs.',
              style: TextStyle(
                fontSize: 13, color: isDark ? Colors.white54 : AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            OutlinedButton.icon(
              onPressed: () {
                _searchController.clear();
                _tabController.index = 0;
                _onSearchChanged('');
              },
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Clear Filters', style: TextStyle(fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryBlue,
                side: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusPill)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
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
                  const SizedBox(height: AppSpacing.md),

                  // Metadata Badges (Authority / Year)
                  if (exam.metadata != null && (exam.metadata!['authority'] != null || exam.metadata!['year'] != null))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: Row(
                        children: [
                          if (exam.metadata!['authority'] != null)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.white.withOpacity(0.3), width: 0.5),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.verified, size: 10, color: Colors.amberAccent),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${exam.metadata!['authority']}'.toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          if (exam.metadata!['year'] != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.white.withOpacity(0.3), width: 0.5),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today, size: 10, color: Colors.lightBlueAccent),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${exam.metadata!['year']}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                
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
                    _buildStat(Icons.quiz_rounded, '${exam.totalQuestions ?? 0} Qs'),
                    const SizedBox(width: AppSpacing.md),
                    _buildStat(Icons.timer_rounded, '${exam.duration ?? 0} min'),
                    const Spacer(),
                    // CTA button
                    GestureDetector(
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
                                return SlideTransition(
                                  position: Tween(begin: const Offset(1.0, 0.0), end: Offset.zero)
                                      .chain(CurveTween(curve: Curves.easeInOutCubic))
                                      .animate(animation),
                                  child: child,
                                );
                              },
                              transitionDuration: const Duration(milliseconds: 300),
                            ),
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              exam.attempts != null && (exam.attempts!['count'] ?? 0) > 0
                                  ? 'View Result'
                                  : 'Start Test',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: gradientColors[0],
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              exam.attempts != null && (exam.attempts!['count'] ?? 0) > 0
                                  ? Icons.bar_chart_rounded
                                  : Icons.play_arrow_rounded,
                              size: 14,
                              color: gradientColors[0],
                            ),
                          ],
                        ),
                      ),
                    ),
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
