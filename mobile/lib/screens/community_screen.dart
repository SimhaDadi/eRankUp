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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Community'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            color: AppColors.primaryBlue,
            onPressed: () => _showCreatePostSheet(context),
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _posts.length,
              itemBuilder: (context, index) {
                final post = _posts[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: theme.dividerColor.withOpacity(0.5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: Colors.blue.shade100,
                            child: Text(
                              post.userName[0],
                              style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(post.userName, style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text(
                                '${post.category} • ${post.createdAt.day}/${post.createdAt.month}',
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                              ),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(post.content, style: const TextStyle(fontSize: 15, height: 1.4)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _buildAction(
                            post.isLiked ? Icons.favorite : Icons.favorite_border, 
                            post.likesCount.toString(),
                            onTap: () => _toggleLike(post),
                            color: post.isLiked ? Colors.red : Colors.grey,
                          ),
                          const SizedBox(width: 24),
                          _buildAction(
                            Icons.chat_bubble_outline, 
                            post.commentsCount.toString(),
                            onTap: () => _showCommentsSheet(post),
                          ),
                          const Spacer(),
                          const Icon(Icons.share_outlined, size: 20, color: Colors.grey),
                        ],
                      )
                    ],
                  ),
                );
              },
            ),
    );
  }

  void _showCreatePostSheet(BuildContext context) {
    final TextEditingController controller = TextEditingController();
    bool isPosting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20,
            left: 20,
            right: 20,
          ),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Text('Create Post', style: AppTextStyles.h2),
                   IconButton(
                     icon: const Icon(Icons.close),
                     onPressed: () => Navigator.pop(context),
                   ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                maxLines: 5,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: "What's on your mind?",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark 
                    ? Colors.white.withOpacity(0.05) 
                    : Colors.grey.shade50,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isPosting ? null : () async {
                    final content = controller.text.trim();
                    if (content.isEmpty) return;

                    setModalState(() => isPosting = true);
                    final apiService = Provider.of<ApiService>(context, listen: false);
                    
                    try {
                      final response = await apiService.createCommunityPost(content, category: 'General');
                      if (response.statusCode == 201 || response.statusCode == 200) {
                        if (mounted) {
                          Navigator.pop(context);
                          _fetchFeed();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Post shared successfully!')),
                          );
                        }
                      } else {
                        throw Exception('Failed to post');
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to share post. Please try again.')),
                        );
                      }
                    } finally {
                      setModalState(() => isPosting = false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                  child: isPosting 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Post to Community', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAction(IconData icon, String count, {VoidCallback? onTap, Color? color}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          Icon(icon, size: 20, color: color ?? Colors.grey),
          const SizedBox(width: 6),
          Text(count, style: TextStyle(color: color ?? Colors.grey, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _toggleLike(CommunityPost post) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    // Optmistically update UI
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
        _fetchFeed(); // Revert on failure
      }
    } catch (e) {
      _fetchFeed();
    }
  }

  void _showCommentsSheet(CommunityPost post) {
    final TextEditingController commentController = TextEditingController();
    List<CommunityComment> comments = [];
    bool isLoadingComments = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          if (isLoadingComments) {
            _fetchComments(post.id).then((fetchedComments) {
              setModalState(() {
                comments = fetchedComments;
                isLoadingComments = false;
              });
            });
          }

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Text('Comments', style: AppTextStyles.h3),
                      const Spacer(),
                      Text('${comments.length} total', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    ],
                  ),
                ),
                Expanded(
                  child: isLoadingComments 
                    ? const Center(child: CircularProgressIndicator())
                    : comments.isEmpty 
                      ? const Center(child: Text('No comments yet. Be the first!'))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: comments.length,
                          itemBuilder: (context, index) {
                            final comment = comments[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: Colors.blue.shade50,
                                    child: Text(comment.userName[0], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(comment.userName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                            const SizedBox(width: 8),
                                            Text(
                                              DateFormat('MMM d, h:mm a').format(comment.createdAt),
                                              style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(comment.content, style: const TextStyle(fontSize: 14)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: commentController,
                          decoration: InputDecoration(
                            hintText: 'Add a comment...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(25),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.white.withOpacity(0.05) 
                              : Colors.grey.shade100,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: () async {
                          final content = commentController.text.trim();
                          if (content.isEmpty) return;
                          
                          final apiService = Provider.of<ApiService>(context, listen: false);
                          try {
                            final response = await apiService.addPostComment(post.id, content);
                            if (response.statusCode == 201 || response.statusCode == 200) {
                              commentController.clear();
                              final newComment = CommunityComment.fromJson(jsonDecode(response.body));
                              setModalState(() {
                                comments.add(newComment);
                              });
                              _fetchFeed(); // Refresh main feed count
                            }
                          } catch (e) {
                             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to comment')));
                          }
                        },
                        icon: const Icon(Icons.send, color: AppColors.primaryBlue),
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
