import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'interceptors/translation_interceptor.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late final Dio dio;
  
  final String _baseUrl = 'https://hackcbs-cjno.onrender.com/api';
  
  // Future deduplication for concurrent 401 token refreshes
  Future<bool>? _ongoingRefresh;

  factory ApiClient() {
    return _instance;
  }

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      headers: {'Content-Type': 'application/json'},
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
    ));

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final accessToken = prefs.getString('accessToken');

          // List of paths that do not require an authorization header
          final noAuthPaths = [
            '/auth/login',
            '/auth/signup',
            '/auth/verify-login-otp',
            '/auth/verify-signup-otp',
            '/auth/resend-otp',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/auth/refresh-token',
            '/auth/google',
            '/auth/digilocker/url',
            '/auth/digilocker/callback',
          ];

          final isNoAuth = noAuthPaths.any((p) => options.path.contains(p));
          if (accessToken != null && accessToken.isNotEmpty && !isNoAuth) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          final isNoRefreshPath = e.requestOptions.path.contains('/auth/refresh-token') ||
              e.requestOptions.path.contains('/auth/login') ||
              e.requestOptions.path.contains('/auth/signup');

          if (e.response?.statusCode == 401 && !isNoRefreshPath) {
            // Token might be expired, attempt synchronized refresh
            final success = await synchronizedRefreshToken();
            if (success) {
              final prefs = await SharedPreferences.getInstance();
              final newAccessToken = prefs.getString('accessToken');
              
              // Retry the failed request with the new token
              final opts = e.requestOptions;
              opts.headers['Authorization'] = 'Bearer $newAccessToken';
              
              try {
                final response = await dio.fetch(opts);
                return handler.resolve(response);
              } on DioException catch (retryError) {
                return handler.next(retryError);
              }
            } else {
              // Refresh failed, clean up local auth state
              await clearAuthData();
              return handler.next(e);
            }
          }
          return handler.next(e);
        },
      ),
    );
    dio.interceptors.add(TranslationInterceptor());
  }

  Future<bool> synchronizedRefreshToken() async {
    if (_ongoingRefresh != null) {
      return _ongoingRefresh!;
    }
    _ongoingRefresh = _performRefreshToken();
    try {
      final res = await _ongoingRefresh!;
      return res;
    } finally {
      _ongoingRefresh = null;
    }
  }

  Future<bool> _performRefreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refreshToken');

      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      // Use a separate Dio instance to avoid infinite interceptor loops
      final refreshDio = Dio(BaseOptions(
        baseUrl: _baseUrl,
        headers: {'Content-Type': 'application/json'},
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
      ));

      final response = await refreshDio.post('/auth/refresh-token', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200 && response.data != null && response.data['success'] == true) {
        final newAccessToken = response.data['data']?['accessToken'] as String?;
        if (newAccessToken != null && newAccessToken.isNotEmpty) {
          await prefs.setString('accessToken', newAccessToken);
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user_data');
  }
}

