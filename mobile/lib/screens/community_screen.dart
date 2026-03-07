import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/community_post.dart';
import '../models/community_comment.dart';
import '../theme/app_theme.dart';
import 'package:intl/intl.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  List<CommunityPost> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFeed();
  }

  Future<void> _fetchFeed() async {
    setState(() => _isLoading = true);
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/community/feed');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _posts = data.map((json) => CommunityPost.fromJson(json)).toList();
        });
      }
    } catch (e) {
      debugPrint('Error fetching feed: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0F1E) : const Color(0xFFF4F7FF),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                  _buildHeroBanner(isDark),
                  Expanded(
                    child: _posts.isEmpty
                        ? _buildEmptyState(isDark)
                        : RefreshIndicator(
                            onRefresh: _fetchFeed,
                            color: AppColors.primaryBlue,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(
                                AppSpacing.screenPadding,
                                AppSpacing.lg,
                                AppSpacing.screenPadding,
                                100,
                              ),
                              itemCount: _posts.length,
                              itemBuilder: (context, index) =>
                                  _buildPostCard(_posts[index], isDark),
                            ),
                          ),
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreatePostSheet(context),
        backgroundColor: AppColors.primaryBlue,
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusPill)),
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'New Post',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 0.3),
        ),
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
        AppSpacing.screenPadding,
        AppSpacing.xl,
        AppSpacing.screenPadding,
        AppSpacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: badge + icons
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
                    Icon(Icons.people_rounded, color: Colors.white, size: 12),
                    SizedBox(width: 5),
                    Text(
                      'STUDENT COMMUNITY',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _showCreatePostSheet(context),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Text(
            'Community Hub 🎓',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Discuss, ask doubts, share tricks & motivate each other.',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          // Stats chips
          Row(
            children: [
              _statChip('💬', 'Ask Doubts'),
              const SizedBox(width: 8),
              _statChip('🎯', 'Share Tips'),
              const SizedBox(width: 8),
              _statChip('🔥', 'Motivate'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statChip(String emoji, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        border: Border.all(color: Colors.white.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostCard(CommunityPost post, bool isDark) {
    // Deterministic color per user
    final avatarColors = [
      [const Color(0xFF3366FF), const Color(0xFF00E5FF)],
      [const Color(0xFFA200FF), const Color(0xFF3366FF)],
      [const Color(0xFF00C896), const Color(0xFF3366FF)],
      [const Color(0xFFFF6B00), const Color(0xFFFFB300)],
      [const Color(0xFFE91E8C), const Color(0xFFA200FF)],
    ];
    final grad = avatarColors[post.userName.codeUnitAt(0) % avatarColors.length];

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161F3D) : Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade100,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.grey.withOpacity(0.07),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author row
          Row(
            children: [
              // Gradient avatar
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: grad, begin: Alignment.topLeft, end: Alignment.bottomRight),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    post.userName[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.userName,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primaryBlue.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            post.category,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryBlue,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '• ${DateFormat('MMM d').format(post.createdAt)}',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.white38 : AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.md),

          // Post content
          Text(
            post.content,
            style: TextStyle(
              fontSize: 14,
              height: 1.55,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white.withOpacity(0.87) : AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: AppSpacing.md),
          Divider(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade100, height: 1),
          const SizedBox(height: AppSpacing.sm),

          // Actions row
          Row(
            children: [
              _buildActionButton(
                post.isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                post.likesCount.toString(),
                onTap: () => _toggleLike(post),
                color: post.isLiked ? Colors.pinkAccent : (isDark ? Colors.white38 : AppColors.textSecondary),
                active: post.isLiked,
              ),
              const SizedBox(width: AppSpacing.xl),
              _buildActionButton(
                Icons.chat_bubble_outline_rounded,
                post.commentsCount.toString(),
                onTap: () => _showCommentsSheet(post),
                color: isDark ? Colors.white38 : AppColors.textSecondary,
              ),
              const Spacer(),
              Icon(
                Icons.share_outlined,
                size: 18,
                color: isDark ? Colors.white30 : Colors.grey.shade400,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String count, {VoidCallback? onTap, Color? color, bool active = false}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 5),
          Text(
            count,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A3A8A), Color(0xFF3A7BD5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(child: Text('🎓', style: TextStyle(fontSize: 44))),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Start the Conversation!',
              style: AppTextStyles.h2.copyWith(
                color: isDark ? Colors.white : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Be the first to post — ask a doubt, share a shortcut, or motivate your fellow aspirants.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                height: 1.6,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white60 : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.xxxl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showCreatePostSheet(context),
                icon: const Icon(Icons.edit_rounded),
                label: const Text('Write First Post'),
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
          ],
        ),
      ),
    );
  }

  void _showCreatePostSheet(BuildContext context) {
    final TextEditingController controller = TextEditingController();
    bool isPosting = false;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: AppSpacing.xl,
            left: AppSpacing.screenPadding,
            right: AppSpacing.screenPadding,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161F3D) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXl)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Text(
                    'Share with Community',
                    style: AppTextStyles.h3.copyWith(
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: isDark ? Colors.white54 : AppColors.textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: controller,
                maxLines: 5,
                autofocus: true,
                style: TextStyle(
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
                decoration: InputDecoration(
                  hintText: "Ask a doubt, share a trick, or motivate others...",
                  hintStyle: TextStyle(color: isDark ? Colors.white38 : AppColors.textSecondary, fontSize: 13),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: BorderSide(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: BorderSide(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
                  ),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                  contentPadding: const EdgeInsets.all(AppSpacing.lg),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: isPosting ? null : () async {
                    final content = controller.text.trim();
                    if (content.isEmpty) return;
                    setModalState(() => isPosting = true);
                    final apiService = Provider.of<ApiService>(context, listen: false);
                    try {
                      final response = await apiService.createCommunityPost(content, category: 'General');
                      if ((response.statusCode == 201 || response.statusCode == 200) && mounted) {
                        Navigator.pop(context);
                        _fetchFeed();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Post shared! 🎉'),
                            backgroundColor: AppColors.primaryBlue,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      }
                    } catch (_) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to post. Please try again.')),
                        );
                      }
                    } finally {
                      setModalState(() => isPosting = false);
                    }
                  },
                  icon: isPosting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.send_rounded, size: 18),
                  label: Text(isPosting ? 'Posting...' : 'Post to Community'),
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
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _toggleLike(CommunityPost post) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    setState(() {
      final index = _posts.indexWhere((p) => p.id == post.id);
      if (index != -1) {
        final current = _posts[index];
        _posts[index] = CommunityPost(
          id: current.id,
          content: current.content,
          userName: current.userName,
          category: current.category,
          imageUrl: current.imageUrl,
          likesCount: current.isLiked ? current.likesCount - 1 : current.likesCount + 1,
          commentsCount: current.commentsCount,
          isLiked: !current.isLiked,
          createdAt: current.createdAt,
        );
      }
    });
    try {
      final response = await apiService.toggleLike(post.id);
      if (response.statusCode != 200 && response.statusCode != 201) {
        _fetchFeed();
      }
    } catch (_) {
      _fetchFeed();
    }
  }

  void _showCommentsSheet(CommunityPost post) {
    final TextEditingController commentController = TextEditingController();
    List<CommunityComment> comments = [];
    bool isLoadingComments = true;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          if (isLoadingComments) {
            _fetchComments(post.id).then((fetched) {
              setModalState(() {
                comments = fetched;
                isLoadingComments = false;
              });
            });
          }

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF161F3D) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXl)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                // Sheet handle
                Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.lg, AppSpacing.screenPadding, AppSpacing.sm),
                  child: Row(
                    children: [
                      const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: AppColors.primaryBlue),
                      const SizedBox(width: 8),
                      Text(
                        'Comments',
                        style: AppTextStyles.h3.copyWith(color: isDark ? Colors.white : AppColors.textPrimary, fontSize: 17),
                      ),
                      const Spacer(),
                      Text(
                        '${comments.length} total',
                        style: TextStyle(color: isDark ? Colors.white38 : AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: isLoadingComments
                      ? const Center(child: CircularProgressIndicator())
                      : comments.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text('💬', style: TextStyle(fontSize: 40)),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No comments yet.\nBe the first to respond!',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: isDark ? Colors.white54 : AppColors.textSecondary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      height: 1.5,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
                              itemCount: comments.length,
                              itemBuilder: (context, index) {
                                final comment = comments[index];
                                final avatarColors = [
                                  [const Color(0xFF3366FF), const Color(0xFF00E5FF)],
                                  [const Color(0xFFA200FF), const Color(0xFF3366FF)],
                                  [const Color(0xFF00C896), const Color(0xFF3366FF)],
                                ];
                                final cGrad = avatarColors[comment.userName.codeUnitAt(0) % avatarColors.length];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(colors: cGrad, begin: Alignment.topLeft, end: Alignment.bottomRight),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Center(
                                          child: Text(
                                            comment.userName[0].toUpperCase(),
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(AppSpacing.md),
                                          decoration: BoxDecoration(
                                            color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                                            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    comment.userName,
                                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: isDark ? Colors.white : AppColors.textPrimary),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    DateFormat('MMM d, h:mm a').format(comment.createdAt),
                                                    style: TextStyle(color: isDark ? Colors.white38 : AppColors.textSecondary, fontSize: 10),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                comment.content,
                                                style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : AppColors.textPrimary, height: 1.4),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                ),
                // Comment input bar
                Container(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.screenPadding, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                    border: Border(top: BorderSide(color: isDark ? const Color(0xFF2B3A67) : Colors.grey.shade200)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: commentController,
                          style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimary, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Write a comment...',
                            hintStyle: TextStyle(color: isDark ? Colors.white38 : AppColors.textSecondary, fontSize: 13),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: isDark ? const Color(0xFF161F3D) : Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () async {
                          final content = commentController.text.trim();
                          if (content.isEmpty) return;
                          final apiService = Provider.of<ApiService>(context, listen: false);
                          try {
                            final response = await apiService.addPostComment(post.id, content);
                            if (response.statusCode == 201 || response.statusCode == 200) {
                              commentController.clear();
                              final newComment = CommunityComment.fromJson(jsonDecode(response.body));
                              setModalState(() => comments.add(newComment));
                              _fetchFeed();
                            }
                          } catch (_) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed to comment')),
                            );
                          }
                        },
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF2456C8), Color(0xFF3A7BD5)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<List<CommunityComment>> _fetchComments(String postId) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.getPostComments(postId);
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => CommunityComment.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching comments: $e');
    }
    return [];
  }
}
