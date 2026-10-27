// Firebase project `classiadshub` options (Android / iOS / Web apps registered in the
// Firebase console). Equivalent to the output of `flutterfire configure`.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  const DefaultFirebaseOptions._();

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
        return ios;
      default:
        return android;
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCunewGP7UaiZ584fAqWziZpy6YRvjIVc8',
    appId: '1:76485180630:android:9e0131fd140a8077465d77',
    messagingSenderId: '76485180630',
    projectId: 'classiadshub',
    storageBucket: 'classiadshub.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyC-KYw__GSXlvetd0ay0GurpOBzv0-YpvQ',
    appId: '1:76485180630:ios:5f3ba14f383ee6a6465d77',
    messagingSenderId: '76485180630',
    projectId: 'classiadshub',
    storageBucket: 'classiadshub.firebasestorage.app',
    iosBundleId: 'com.classiads.classiadsHub',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M',
    appId: '1:76485180630:web:0502a02da1fe5e6a465d77',
    messagingSenderId: '76485180630',
    projectId: 'classiadshub',
    authDomain: 'classiadshub.firebaseapp.com',
    storageBucket: 'classiadshub.firebasestorage.app',
  );
}
