import 'package:shared_preferences/shared_preferences.dart';
import 'package:buildstock_pro/models/user_model.dart';
import 'dart:convert';

class AuthService {
  static const String _userKey = 'current_user';
  static const String _tokenKey = 'auth_token';

  Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String name,
    required String role,
  }) async {
    try {
      // Simulation d'une API - remplacer par appel HTTP réel
      final prefs = await SharedPreferences.getInstance();
      final userId = DateTime.now().millisecondsSinceEpoch.toString();
      
      final user = User(
        id: userId,
        email: email,
        name: name,
        role: role,
        createdAt: DateTime.now(),
      );

      final token = base64Encode(utf8.encode('$email:$password'));
      
      await prefs.setString(_userKey, jsonEncode(user.toJson()));
      await prefs.setString(_tokenKey, token);

      return {'success': true, 'user': user, 'token': token};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userKey);
      
      if (userJson == null) {
        return {'success': false, 'error': 'Utilisateur non trouvé'};
      }

      final user = User.fromJson(jsonDecode(userJson));
      final token = base64Encode(utf8.encode('$email:$password'));
      
      await prefs.setString(_tokenKey, token);

      return {'success': true, 'user': user, 'token': token};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userKey);
      
      if (userJson == null) return null;
      
      return User.fromJson(jsonDecode(userJson));
    } catch (e) {
      return null;
    }
  }

  Future<bool> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
      await prefs.remove(_tokenKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> isAuthenticated() async {
    final user = await getCurrentUser();
    return user != null;
  }
}
