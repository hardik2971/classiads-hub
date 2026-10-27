import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/router/app_router.dart';
import 'core/services/notification_service.dart';
import 'core/storage/app_prefs.dart';
import 'core/theme/app_theme.dart';
import 'firebase_options.dart';

/// Background message handler — must be a top-level function so the FCM
/// isolate can resolve it cold.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise Firebase with whatever options ship in `firebase_options.dart`.
  // The file is a stub until `flutterfire configure` runs — when that happens
  // these credentials become real and Crashlytics/Messaging start working.
  // The try/catch keeps the rest of the app booting if Firebase fails.
  var firebaseReady = false;
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    firebaseReady = true;
  } catch (e) {
    debugPrint('Firebase init skipped: $e');
  }

  // Route Flutter framework errors and unhandled async errors to Crashlytics
  // (skipped on Web — Crashlytics has no web support).
  if (firebaseReady && !kIsWeb) {
    FlutterError.onError =
        FirebaseCrashlytics.instance.recordFlutterFatalError;
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  }

  // Register the background push handler. The native side wakes up the engine
  // for FCM payloads even when the app is terminated. Skip when Firebase
  // failed to initialise.
  if (firebaseReady) {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  final prefs = await SharedPreferences.getInstance();

  // ProviderContainer used only to bootstrap the notification service so it's
  // alive before the widget tree builds — keeps the service instance the same
  // one the rest of the app reads via `notificationServiceProvider`.
  final container = ProviderContainer(
    overrides: [sharedPrefsProvider.overrideWithValue(prefs)],
  );
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const ClassiAdsApp(),
    ),
  );

  // Initialise notifications after the first frame is scheduled — the
  // permission prompt must not hold the app on a blank screen.
  if (firebaseReady) {
    container.read(notificationServiceProvider).initialize().catchError((Object e) {
      debugPrint('Notification service init skipped: $e');
    });
  }
}

class ClassiAdsApp extends ConsumerWidget {
  const ClassiAdsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'ClassiAds Hub',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      // Screens are styled with the light palette (AppTheme.backgroundLight /
      // textDark are hard-coded), so dark mode renders mixed light/dark
      // surfaces. Ship light-only until the screens use theme colours.
      themeMode: ThemeMode.light,
      routerConfig: router,
    );
  }
}
