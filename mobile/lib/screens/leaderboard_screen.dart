import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<dynamic>? _leaderboard;
  bool _isLoading = true;
  int? _userRank;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    try {
      final response = await apiService.get('/exams/performance/leaderboard');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List;
        setState(() {
          _leaderboard = data;
          _isLoading = false;
          // Find user's rank (assuming API returns user info)
          _userRank = data.indexWhere((entry) => entry['isCurrentUser'] == true) + 1;
        });
      }
    } catch (e) {
      debugPrint('Error fetching leaderboard: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Global Leaderboard'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // User's Rank Card
          if (_userRank != null && _userRank! > 0)
            Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: Theme.of(context).brightness == Brightness.dark 
                    ? [const Color(0xFF6B21A8), const Color(0xFF1E40AF)]
                    : [Colors.purple.shade400, Colors.blue.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: Theme.of(context).brightness == Brightness.dark ? [] : [
                  BoxShadow(
                    color: Colors.purple.shade200,
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.person, color: Colors.white, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Your Rank',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '#$_userRank',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.emoji_events, color: Colors.amber, size: 48),
                ],
              ),
            ),
          
          // Leaderboard Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                const Text(
                  'Top Performers',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? const Color(0xFF1E293B) 
                      : Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_leaderboard?.length ?? 0} Users',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).brightness == Brightness.dark 
                        ? Colors.blueAccent 
                        : Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Leaderboard List
          Expanded(
            child: _leaderboard == null || _leaderboard!.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.leaderboard, size: 64, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text(
                          'No data available',
                          style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.grey.shade600),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _leaderboard!.length,
                    itemBuilder: (context, index) {
                      final entry = _leaderboard![index];
                      final rank = index + 1;
                      final isCurrentUser = entry['isCurrentUser'] == true;
                      
                      return _buildLeaderboardCard(
                        rank: rank,
                        name: entry['user_name'] ?? 'Anonymous',
                        score: (entry['max_score'] as num?)?.round() ?? 0,
                        accuracy: (entry['avg_accuracy'] as num?)?.round() ?? 0,
                        isCurrentUser: isCurrentUser,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboardCard({
    required int rank,
    required String name,
    required int score,
    required int accuracy,
    required bool isCurrentUser,
  }) {
    Color? medalColor;
    IconData? medalIcon;
    
    if (rank == 1) {
      medalColor = Colors.amber;
      medalIcon = Icons.emoji_events;
    } else if (rank == 2) {
      medalColor = Colors.grey.shade400;
      medalIcon = Icons.emoji_events;
    } else if (rank == 3) {
      medalColor = Colors.brown.shade300;
      medalIcon = Icons.emoji_events;
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrentUser 
          ? (isDark ? const Color(0xFF1E293B) : Colors.blue.shade50) 
          : theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrentUser 
            ? (isDark ? Colors.blueAccent.withOpacity(0.5) : Colors.blue.shade200) 
            : (isDark ? const Color(0xFF334155) : Colors.grey.shade100),
          width: isCurrentUser ? 2 : 1,
        ),
        boxShadow: (isCurrentUser && !isDark)
            ? [
                BoxShadow(
                  color: Colors.blue.shade100,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          // Rank Badge
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: medalColor ?? (isDark ? const Color(0xFF0F172A) : Colors.grey.shade100),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: medalIcon != null
                  ? Icon(medalIcon, color: Colors.white, size: 20)
                  : Text(
                      '$rank',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: medalColor != null ? Colors.white : (isDark ? Colors.white38 : Colors.black87),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 16),
          
          // User Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isCurrentUser 
                            ? (isDark ? Colors.blueAccent : Colors.blue.shade900) 
                            : theme.textTheme.bodyLarge?.color,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCurrentUser) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade600,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '$accuracy% Accuracy',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white60 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          
          // Score
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green.shade400, Colors.green.shade600],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$score PTS',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
