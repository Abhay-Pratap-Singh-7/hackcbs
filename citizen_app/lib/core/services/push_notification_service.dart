import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sih_2026/core/localization/app_language.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/features/notifications/data/repositories/notification_repository.dart';

/// Top-level background message handler required by Firebase Messaging
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  if (kDebugMode) {
    print('[FCM Background Message]: ${message.messageId} - ${message.notification?.title}');
  }
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final NotificationRepository _notificationRepository = NotificationRepository();
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  bool _isFirebaseReady = false;
  void Function(String path)? _navigationCallback;

  static const AndroidNotificationChannel _highImportanceChannel = AndroidNotificationChannel(
    'civic_notifications_high_importance',
    'Civic Alerts & Updates',
    description: 'Critical notifications for civic issues, status changes, and nearby reports.',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  /// Initialize Firebase, FCM listeners, and local heads-up notifications
  Future<void> initialize({required void Function(String path) onNavigate}) async {
    _navigationCallback = onNavigate;

    try {
      await Firebase.initializeApp();
      _isFirebaseReady = true;
    } catch (e) {
      if (kDebugMode) {
        print('[PushNotificationService] Firebase not yet initialized or credentials missing: $e');
      }
      return;
    }

    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 1. Initialize local notifications for Android foreground heads-up banner
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (response) {
          final payload = response.payload;
          if (payload != null && payload.isNotEmpty) {
            _handlePayloadNavigation(payload);
          }
        },
      );

      // Create Android high-importance notification channel & request Android 13+ permission
      final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        await androidPlugin.createNotificationChannel(_highImportanceChannel);
        await androidPlugin.requestNotificationsPermission();
      }

      // 2. Request notification permissions from Firebase Messaging
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      // Enable heads-up foreground presentation options
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      if (kDebugMode) {
        print('[PushNotificationService] AuthorizationStatus: ${settings.authorizationStatus}');
      }

      // 3. Foreground message listener (Shows Heads-Up notification banner)
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('[FCM Foreground]: ${message.notification?.title} - ${message.notification?.body}');
        }
        _showForegroundNotification(message);
        // Instantly bump unread count and synchronize with backend
        NotificationRepository.unreadCountNotifier.value++;
        _notificationRepository.getUnreadCount();
      });

      // 4. Background message click listener (When app is opened from background by tapping push)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('[FCM OpenedApp]: ${message.data}');
        }
        _handleDataNavigation(message.data);
      });

      // 5. Terminated state message check (When app was closed and opened directly by tapping push)
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleDataNavigation(initialMessage.data);
      }

      // 6. Token handling & sync with backend
      await syncTokenWithBackend();

      // Listen for token refresh events
      messaging.onTokenRefresh.listen((newToken) async {
        if (kDebugMode) {
          print('[FCM Token Refreshed]: $newToken');
        }
        await _notificationRepository.registerFcmToken(newToken);
      });
    } catch (e) {
      if (kDebugMode) {
        print('[PushNotificationService] Initialization warning: $e');
      }
    }
  }

  /// Show heads-up notification banner while app is in foreground
  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    final problemId = message.data['problemId']?.toString();
    final notifType = message.data['type']?.toString();
    final payloadString = jsonEncode({
      'problemId': problemId,
      'type': notifType ?? '',
    });

    String displayTitle = notification.title ?? 'India Samadhan';
    String displayBody = notification.body ?? '';

    try {
      final prefs = await SharedPreferences.getInstance();
      final code = prefs.getString('selected_app_language_code');
      final lang = AppLanguage.fromCode(code);
      final l10n = AppLocalizations(lang);
      displayTitle = l10n.translateNotificationTitle(displayTitle, notifType);
      displayBody = l10n.translateNotificationMessage(displayBody, notifType);
    } catch (_) {}

    try {
      _localNotifications.show(
        notification.hashCode,
        displayTitle,
        displayBody,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _highImportanceChannel.id,
            _highImportanceChannel.name,
            channelDescription: _highImportanceChannel.description,
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            largeIcon: const DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
            color: const Color(0xFF1E6F42),
            playSound: true,
            enableVibration: true,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: payloadString,
      );
    } catch (e) {
      if (kDebugMode) {
        print('[PushNotificationService] _showForegroundNotification error: $e');
      }
    }
  }

  /// Navigate based on payload from local notification tap
  void _handlePayloadNavigation(String payload) {
    try {
      final map = jsonDecode(payload) as Map<String, dynamic>;
      _handleDataNavigation(map);
    } catch (_) {
      _navigationCallback?.call('/notifications');
    }
  }

  /// Deep link navigation based on FCM data payload
  void _handleDataNavigation(Map<String, dynamic> data) {
    final problemId = data['problemId']?.toString();
    if (problemId != null && problemId.isNotEmpty && problemId != 'null') {
      _navigationCallback?.call('/issue/$problemId');
    } else {
      _navigationCallback?.call('/notifications');
    }
  }

  /// Sync device FCM token to backend
  Future<void> syncTokenWithBackend() async {
    if (!_isFirebaseReady) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        if (kDebugMode) {
          print('[PushNotificationService] Registering device FCM token with backend: $token');
        }
        await _notificationRepository.registerFcmToken(token);
      }
    } catch (e) {
      if (kDebugMode) {
        print('[PushNotificationService] syncTokenWithBackend error: $e');
      }
    }
  }

  /// Unregister FCM token on logout
  Future<void> unregisterCurrentToken() async {
    if (!_isFirebaseReady) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _notificationRepository.unregisterFcmToken(token);
      }
    } catch (_) {}
  }

  /// Subscribe to a regional civic topic (e.g. 'district_ranchi')
  Future<void> subscribeToTopic(String topic) async {
    if (!_isFirebaseReady) return;
    try {
      final sanitized = topic.replaceAll(RegExp(r'[^a-zA-Z0-9-_.~%]+'), '_');
      await FirebaseMessaging.instance.subscribeToTopic(sanitized);
    } catch (_) {}
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    if (!_isFirebaseReady) return;
    try {
      final sanitized = topic.replaceAll(RegExp(r'[^a-zA-Z0-9-_.~%]+'), '_');
      await FirebaseMessaging.instance.unsubscribeFromTopic(sanitized);
    } catch (_) {}
  }
}
