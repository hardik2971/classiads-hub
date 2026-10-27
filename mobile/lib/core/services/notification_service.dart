import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Centralises every notification touch-point:
///   * Initialises `flutter_local_notifications` with platform-correct icons.
///   * Requests user permission (iOS + Android 13+).
///   * Bridges FCM foreground messages → local notifications so the user sees
///     pushes even when the app is in the foreground (FCM hides them otherwise).
///   * Streams notification taps via [taps], so the router can deep-link in
///     response without coupling to the plugin.
class NotificationService {
  NotificationService(this._messaging);

  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  final _tapsCtrl = StreamController<Map<String, dynamic>>.broadcast();

  /// Emits the data payload of every notification the user taps. Subscribe
  /// once at app start (e.g. in main.dart or a top-level Consumer) and route
  /// based on payload contents (e.g. `route` / `ad_id` keys).
  Stream<Map<String, dynamic>> get taps => _tapsCtrl.stream;

  static const _defaultChannel = AndroidNotificationChannel(
    'classiads_default',
    'ClassiAds notifications',
    description: 'Default channel for marketing & transactional pushes.',
    importance: Importance.high,
  );

  Future<void> initialize() async {
    // Web has no flutter_local_notifications backend — FCM renders directly.
    if (kIsWeb) {
      await _requestPermission();
      _attachForegroundListeners();
      return;
    }

    // Android setup — small icon must exist in res/drawable. We use the launcher
    // by default; swap to a dedicated white-on-transparent icon for production.
    const androidInit =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS — request permission on first init so the prompt shows once.
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _local.initialize(
      const InitializationSettings(android: androidInit, iOS: iosInit),
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) {
          _tapsCtrl.add({'payload': payload});
        }
      },
    );

    // Create the Android channel up-front — required for Android 8.0+ to show
    // any notification at all.
    if (!kIsWeb && Platform.isAndroid) {
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_defaultChannel);
    }

    await _requestPermission();
    _attachForegroundListeners();
  }

  Future<void> _requestPermission() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // Android 13+ requires runtime POST_NOTIFICATIONS — flutter_local_notifications
    // exposes this on the Android plugin instance.
    if (!kIsWeb && Platform.isAndroid) {
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    }
  }

  void _attachForegroundListeners() {
    // Foreground FCM messages — FCM does NOT render anything by default, so
    // surface them via a local notification.
    FirebaseMessaging.onMessage.listen((message) {
      final n = message.notification;
      if (n == null) return; // data-only payloads are handled by callers
      _showNow(
        title: n.title ?? '',
        body: n.body ?? '',
        payload: message.data.isEmpty ? null : message.data.toString(),
      );
    });

    // Tap while app is in background (not terminated).
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _tapsCtrl.add(message.data);
    });

    // Tap that cold-launched the app.
    _messaging.getInitialMessage().then((message) {
      if (message != null) _tapsCtrl.add(message.data);
    });
  }

  /// Show a one-off notification right now (useful for in-app reminders,
  /// post-action confirmations, etc.).
  Future<void> showLocal({
    required String title,
    required String body,
    String? payload,
  }) =>
      _showNow(title: title, body: body, payload: payload);

  Future<void> _showNow({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (kIsWeb) return;
    await _local.show(
      DateTime.now().millisecondsSinceEpoch.remainder(0x7fffffff),
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _defaultChannel.id,
          _defaultChannel.name,
          channelDescription: _defaultChannel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(presentSound: true),
      ),
      payload: payload,
    );
  }

  /// Current FCM token — needed to target a device from your backend.
  /// Returns null on Web when no VAPID key has been registered.
  Future<String?> deviceToken() => _messaging.getToken();

  void dispose() => _tapsCtrl.close();
}

final notificationServiceProvider = Provider<NotificationService>(
  (ref) {
    final svc = NotificationService(FirebaseMessaging.instance);
    ref.onDispose(svc.dispose);
    return svc;
  },
);
