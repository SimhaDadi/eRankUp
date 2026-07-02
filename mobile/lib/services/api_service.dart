import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/config.dart';

class ApiService {
  static String get baseUrl => Config.apiBaseUrl;
  bool _isRefreshing = false;

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_id');
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    
    try {
      // Attempt to fetch fresh profile from server
      final response = await get('/users/profile');
      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        
        // Update local cache
        await prefs.setString('user_profile', jsonEncode(userData));
        if (userData['fullName'] != null) {
          await prefs.setString('user_name', userData['fullName']);
        }
        if (userData['email'] != null) {
          await prefs.setString('user_email', userData['email']);
        }
        
        return userData;
      }
    } catch (e) {
      print('Error fetching remote profile: $e');
    }

    // Fallback to local cache if server is unreachable or fails
    final userJson = prefs.getString('user_profile');
    if (userJson != null) {
      return jsonDecode(userJson);
    }
    return null;
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> get(String endpoint) async {
    return _requestWithRefresh(() async {
      final url = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      return await http.get(url, headers: headers);
    });
  }

  Future<http.Response> post(String endpoint, dynamic body) async {
    return _requestWithRefresh(() async {
      final url = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      return await http.post(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
    });
  }

  Future<http.Response> patch(String endpoint, dynamic body) async {
    return _requestWithRefresh(() async {
      final url = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      return await http.patch(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
    });
  }

  Future<http.Response> delete(String endpoint) async {
    return _requestWithRefresh(() async {
      final url = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      return await http.delete(url, headers: headers);
    });
  }

  Future<http.Response> uploadFile(String endpoint, String filePath, String fieldName) async {
    return _requestWithRefresh(() async {
      final url = Uri.parse('$baseUrl$endpoint');
      final token = await getToken();
      
      final request = http.MultipartRequest('POST', url);
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      
      request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));
      
      final streamedResponse = await request.send();
      return await http.Response.fromStream(streamedResponse);
    });
  }

  Future<http.Response> _requestWithRefresh(Future<http.Response> Function() request) async {
    final response = await request();
    
    if (response.statusCode == 401) {
      final success = await _refreshToken();
      if (success) {
        return await request();
      } else {
        await logout();
        throw Exception('Session expired. Please login again.');
      }
    }
    
    return response;
  }

  Future<bool> _refreshToken() async {
    if (_isRefreshing) return false;
    _isRefreshing = true;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');
      final userId = prefs.getString('user_id');
      
      if (refreshToken == null || userId == null) return false;
      
      final url = Uri.parse('$baseUrl/auth/refresh');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'refreshToken': refreshToken,
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await prefs.setString('jwt_token', data['access_token']);
        if (data['refresh_token'] != null) {
          await prefs.setString('refresh_token', data['refresh_token']);
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  Future<bool> updateFcmToken(String token) async {
    try {
      final response = await patch('/users/profile', {'fcmToken': token});
      return response.statusCode == 200;
    } catch (e) {
      print('FCM Token sync error: $e');
      return false;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await patch('/users/profile', data);
      if (response.statusCode == 200) {
        final updatedUser = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        
        // Update the cached profile
        final currentProfileJson = prefs.getString('user_profile');
        if (currentProfileJson != null) {
          final currentProfile = jsonDecode(currentProfileJson);
          currentProfile.addAll(updatedUser);
          await prefs.setString('user_profile', jsonEncode(currentProfile));
          
          // Also update specific fields used by other parts of the app
          if (updatedUser['fullName'] != null) {
            await prefs.setString('user_name', updatedUser['fullName']);
          }
          if (updatedUser['email'] != null) {
            await prefs.setString('user_email', updatedUser['email']);
          }
        }
        return true;
      }
      try {
        final errorObj = jsonDecode(response.body);
        if (errorObj['message'] != null) {
          throw Exception(errorObj['message']);
        }
      } catch (_) {}
      throw Exception('Server returned status code ${response.statusCode}');
    } catch (e) {
      print('Update Profile Error: $e');
      rethrow;
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveSession(data);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> googleMobileLogin(String token) async {
    try {
      final response = await post('/auth/google/mobile', {
        'token': token,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveSession(data);
        return true;
      }
      return false;
    } catch (e) {
      print('Google Login API Error: $e');
      return false;
    }
  }

  Future<void> _saveSession(Map<String, dynamic> data) async {
    final token = data['access_token'];
    final refreshToken = data['refresh_token'];
    final user = data['user'];
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    if (refreshToken != null) {
      await prefs.setString('refresh_token', refreshToken);
    }
    await prefs.setString('user_id', user['id']);
    await prefs.setString('user_profile', jsonEncode(user));
    await prefs.setString('user_name', user['fullName'] ?? '');
    await prefs.setString('user_email', user['email'] ?? '');
    await prefs.setString('user_role', user['role'] ?? 'STUDENT');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('user_profile');
    await prefs.remove('user_name');
    await prefs.remove('user_email');
    await prefs.remove('user_role');
  }

  // --- AI Chat Methods ---

  Future<http.Response> getAIConversations() async {
    return get('/ai-chat/conversations');
  }

  Future<http.Response> getAIConversationMessages(String conversationId) async {
    return get('/ai-chat/conversation/$conversationId');
  }

  Future<http.Response> sendAIMessage(String message, {String? conversationId, String? questionId}) async {
    return post('/ai-chat/message', {
      'message': message,
      if (conversationId != null) 'conversationId': conversationId,
      if (questionId != null) 'questionId': questionId,
    });
  }

  Future<http.Response> deleteAIConversation(String id) async {
    return delete('/ai-chat/conversation/$id');
  }

  // --- Community Methods ---

  Future<http.Response> createCommunityPost(String content, {String? category, String? imageUrl}) async {
    return post('/community/posts', {
      'content': content,
      if (category != null) 'category': category,
      if (imageUrl != null) 'imageUrl': imageUrl,
    });
  }

  Future<http.Response> toggleLike(String postId) async {
    return post('/community/posts/$postId/like', {});
  }

  Future<http.Response> getPostComments(String postId) async {
    return get('/community/posts/$postId/comments');
  }

  Future<http.Response> addPostComment(String postId, String content) async {
    return post('/community/posts/$postId/comments', {'content': content});
  }
}
