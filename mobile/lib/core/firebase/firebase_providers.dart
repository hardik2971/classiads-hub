import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Single source of truth for Firebase service handles. Consume these from
/// widgets / repositories instead of touching `FirebaseX.instance` directly —
/// that way tests can swap implementations via `ProviderScope.overrides`.

final firebaseAuthProvider = Provider<FirebaseAuth>(
  (_) => FirebaseAuth.instance,
);

final firestoreProvider = Provider<FirebaseFirestore>(
  (_) => FirebaseFirestore.instance,
);

final firebaseStorageProvider = Provider<FirebaseStorage>(
  (_) => FirebaseStorage.instance,
);

final firebaseMessagingProvider = Provider<FirebaseMessaging>(
  (_) => FirebaseMessaging.instance,
);

final firebaseAnalyticsProvider = Provider<FirebaseAnalytics>(
  (_) => FirebaseAnalytics.instance,
);

final firebaseRemoteConfigProvider = Provider<FirebaseRemoteConfig>(
  (_) => FirebaseRemoteConfig.instance,
);

/// Crashlytics is not supported on Web — accessing the instance there throws.
/// Returning `null` lets call-sites no-op without a `kIsWeb` check at every use.
final firebaseCrashlyticsProvider = Provider<FirebaseCrashlytics?>(
  (_) => kIsWeb ? null : FirebaseCrashlytics.instance,
);

/// Stream of the currently signed-in user (`null` when signed out).
final authStateProvider = StreamProvider<User?>(
  (ref) => ref.watch(firebaseAuthProvider).authStateChanges(),
);
