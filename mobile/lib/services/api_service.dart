import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/config.dart';

class ApiService {
  static String get baseUrl => Config.apiBaseUrl;

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
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    
    // Handle 401 Unauthorized
    if (response.statusCode == 401) {
      await logout();
      throw Exception('Session expired. Please login again.');
    }
    
    return response;
  }

  Future<http.Response> post(String endpoint, dynamic body) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
    
    // Handle 401 Unauthorized
    if (response.statusCode == 401) {
      await logout();
      throw Exception('Session expired. Please login again.');
    }
    
    return response;
  }

  Future<http.Response> patch(String endpoint, dynamic body) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.patch(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
    
    if (response.statusCode == 401) {
      await logout();
      throw Exception('Session expired. Please login again.');
    }
    
    return response;
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
      return false;
    } catch (e) {
      print('Update Profile Error: $e');
      return false;
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
    final user = data['user'];
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    await prefs.setString('user_id', user['id']);
    await prefs.setString('user_profile', jsonEncode(user));
    await prefs.setString('user_name', user['fullName'] ?? '');
    await prefs.setString('user_email', user['email'] ?? '');
    await prefs.setString('user_role', user['role'] ?? 'STUDENT');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
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
    final url = Uri.parse('$baseUrl/ai-chat/conversation/$id');
    final headers = await _getHeaders();
    return http.delete(url, headers: headers);
  }
}
