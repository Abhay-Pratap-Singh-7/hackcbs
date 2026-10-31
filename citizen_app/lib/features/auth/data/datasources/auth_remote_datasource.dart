import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:sih_2026/core/network/api_client.dart';
import 'package:sih_2026/core/services/push_notification_service.dart';
import 'package:sih_2026/features/auth/data/models/user_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel?> getCachedUser();

  Future<UserModel?> checkAuthStatus();

  Future<bool> login({
    required String email,
    required String password,
  });

  Future<UserModel> verifyLoginOtp({
    required String email,
    required String otp,
  });

  Future<UserModel> signup({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String role,
    required Map<String, dynamic> profileDetails,
  });

  Future<UserModel> verifySignupOtp({
    required String email,
    required String otp,
  });

  Future<void> resendOtp({
    required String email,
    required String purpose,
  });

  Future<void> forgotPassword({
    required String email,
  });

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  });

  Future<void> logout();
  
  Future<UserModel> googleLogin({
    required String idToken,
    required String role,
  });
  
  Future<String> getDigilockerUrl();
  
  Future<UserModel> digilockerCallback({
    required String code,
    required String role,
  });

  Future<UserModel> updateProfile({
    String? avatar,
    Map<String, dynamic>? profileDetails,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSourceImpl({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  Future<void> _saveUserData(UserModel user, String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', accessToken);
    await prefs.setString('refreshToken', refreshToken);
    await prefs.setString('user_data', jsonEncode(user.toJson()));

    // Sync FCM token with backend
    try {
      await PushNotificationService().syncTokenWithBackend();
    } catch (_) {}
  }

  @override
  Future<UserModel?> getCachedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user_data');
      if (userString != null && userString.isNotEmpty) {
        final Map<String, dynamic> json = jsonDecode(userString);
        return UserModel.fromJson(json);
      }
    } catch (_) {}
    return null;
  }

  @override
  Future<UserModel?> checkAuthStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refreshToken');
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      final response = await _dio.get('/dashboard/me');
      if (response.statusCode == 200 && response.data != null && response.data['success'] == true) {
        final userData = response.data['data']?['user'];
        if (userData != null) {
          final user = UserModel.fromJson(userData);
          await prefs.setString('user_data', jsonEncode(user.toJson()));
          return user;
        }
      }
      return await getCachedUser();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        // Token verification/refresh failed completely
        await ApiClient().clearAuthData();
        return null;
      }
      // If network issue, fallback to cached user
      return await getCachedUser();
    } catch (_) {
      return await getCachedUser();
    }
  }

  @override
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data']['requiresOtp'] == true;
      } else {
        throw Exception(response.data['message'] ?? 'Login failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<UserModel> verifyLoginOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _dio.post('/auth/verify-login-otp', data: {
        'email': email,
        'otp': otp,
        'purpose': 'LOGIN_VERIFY',
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        await _saveUserData(user, data['tokens']['accessToken'], data['tokens']['refreshToken']);
        return user;
      } else {
        throw Exception(response.data['message'] ?? 'OTP verification failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<UserModel> signup({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String role,
    required Map<String, dynamic> profileDetails,
  }) async {
    try {
      final response = await _dio.post('/auth/signup', data: {
        'name': name,
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'role': role,
        'profileDetails': profileDetails,
      });

      if (response.statusCode == 201 && response.data['success'] == true) {
        return UserModel.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Signup failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<UserModel> verifySignupOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _dio.post('/auth/verify-signup-otp', data: {
        'email': email,
        'otp': otp,
        'purpose': 'SIGNUP_VERIFY',
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        await _saveUserData(user, data['tokens']['accessToken'], data['tokens']['refreshToken']);
        return user;
      } else {
        throw Exception(response.data['message'] ?? 'OTP verification failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> resendOtp({
    required String email,
    required String purpose,
  }) async {
    try {
      final response = await _dio.post('/auth/resend-otp', data: {
        'email': email,
        'purpose': purpose,
      });

      if (response.statusCode != 200 || response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to resend OTP');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> forgotPassword({
    required String email,
  }) async {
    try {
      final response = await _dio.post('/auth/forgot-password', data: {
        'email': email,
      });

      if (response.statusCode != 200 || response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to initiate password reset');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await _dio.post('/auth/reset-password', data: {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      });

      if (response.statusCode != 200 || response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to reset password');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<void> logout() async {
    try {
      await PushNotificationService().unregisterCurrentToken();
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refreshToken');
      
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _dio.post('/auth/logout', data: {
          'refreshToken': refreshToken,
        });
      }
    } catch (_) {
      // Ignore logout api errors
    } finally {
      await ApiClient().clearAuthData();
    }
  }

  @override
  Future<UserModel> googleLogin({
    required String idToken,
    required String role,
  }) async {
    try {
      final response = await _dio.post('/auth/google', data: {
        'idToken': idToken,
        'role': role,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        await _saveUserData(user, data['tokens']['accessToken'], data['tokens']['refreshToken']);
        return user;
      } else {
        throw Exception(response.data['message'] ?? 'Google Login failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<String> getDigilockerUrl() async {
    try {
      final response = await _dio.get('/auth/digilocker/url');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data']['authUrl'];
      } else {
        throw Exception(response.data['message'] ?? 'Failed to get Digilocker URL');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<UserModel> digilockerCallback({
    required String code,
    required String role,
  }) async {
    try {
      final response = await _dio.post('/auth/digilocker/callback', data: {
        'code': code,
        'role': role,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        await _saveUserData(user, data['tokens']['accessToken'], data['tokens']['refreshToken']);
        return user;
      } else {
        throw Exception(response.data['message'] ?? 'Digilocker verification failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }

  @override
  Future<UserModel> updateProfile({
    String? avatar,
    Map<String, dynamic>? profileDetails,
  }) async {
    try {
      final response = await _dio.put('/dashboard/me', data: {
        if (avatar != null) 'avatar': avatar,
        if (profileDetails != null) 'profileDetails': profileDetails,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_data', jsonEncode(user.toJson()));
        
        return user;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to update profile');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message);
    }
  }
}

