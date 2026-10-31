import 'package:flutter/foundation.dart';
import 'package:sih_2026/core/network/api_client.dart';
import 'package:sih_2026/features/notifications/data/models/notification_model.dart';

class NotificationRepository {
  static final ValueNotifier<int> unreadCountNotifier = ValueNotifier<int>(0);
  final ApiClient _apiClient = ApiClient();

  Future<List<NotificationModel>> fetchNotifications({String? type, bool? unreadOnly}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (type != null && type != 'ALL') {
        queryParams['type'] = type;
      }
      if (unreadOnly == true) {
        queryParams['unreadOnly'] = true;
      }

      final response = await _apiClient.dio.get('/notifications', queryParameters: queryParams);
      if (response.data['success'] == true && response.data['data'] is List) {
        return (response.data['data'] as List)
            .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.dio.get('/notifications/unread-count');
      if (response.data['success'] == true) {
        final count = (response.data['unreadCount'] as num?)?.toInt() ?? 0;
        unreadCountNotifier.value = count;
        return count;
      }
      return unreadCountNotifier.value;
    } catch (_) {
      return unreadCountNotifier.value;
    }
  }

  Future<bool> markAsRead(String id) async {
    try {
      final response = await _apiClient.dio.put('/notifications/$id/read');
      if (response.data['success'] == true) {
        final count = (response.data['unreadCount'] as num?)?.toInt();
        if (count != null) {
          unreadCountNotifier.value = count;
        } else if (unreadCountNotifier.value > 0) {
          unreadCountNotifier.value--;
        }
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    try {
      final response = await _apiClient.dio.put('/notifications/mark-all-read');
      if (response.data['success'] == true) {
        unreadCountNotifier.value = 0;
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteNotification(String id) async {
    try {
      final response = await _apiClient.dio.delete('/notifications/$id');
      if (response.data['success'] == true) {
        // Refresh unread count in case the deleted notification was unread
        getUnreadCount();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> updateLocation(double lat, double lng, {String? district}) async {
    try {
      await _apiClient.dio.post('/notifications/update-location', data: {
        'latitude': lat,
        'longitude': lng,
        'district': district,
      });
    } catch (_) {}
  }

  Future<bool> registerFcmToken(String token) async {
    try {
      final response = await _apiClient.dio.post('/notifications/fcm-token', data: {
        'token': token,
      });
      if (kDebugMode) {
        debugPrint('[NotificationRepository] registerFcmToken response: ${response.data}');
      }
      return response.data['success'] == true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[NotificationRepository] registerFcmToken failed: $e');
      }
      return false;
    }
  }

  Future<bool> unregisterFcmToken([String? token]) async {
    try {
      final response = await _apiClient.dio.delete(
        '/notifications/fcm-token',
        data: token != null ? {'token': token} : null,
      );
      return response.data['success'] == true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[NotificationRepository] unregisterFcmToken error: $e');
      }
      return false;
    }
  }
}

