import 'dart:io' show Platform;

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'firebase_providers.dart';

/// Outcome of a social sign-in attempt.
class FirebaseSignInResult {
  const FirebaseSignInResult({
    required this.user,
    required this.isNew,
    this.idToken,
  });

  final User user;
  final bool isNew;

  /// The Firebase ID token — pass this to your backend exchange endpoint so
  /// your Laravel session and the Firebase identity are linked.
  final String? idToken;
}

/// Thin wrapper around `FirebaseAuth.instance` for the social sign-in paths
/// the existing login screen exposes ("Continue with Google", "Continue with
/// Apple"). Uses provider-based sign-in which is supported natively on
/// iOS / Android / Web from firebase_auth ^5.x — no extra `google_sign_in`
/// dependency required.
class FirebaseAuthService {
  FirebaseAuthService(this._auth);

  final FirebaseAuth _auth;

  User? get currentUser => _auth.currentUser;
  Stream<User?> authStateChanges() => _auth.authStateChanges();

  Future<FirebaseSignInResult> signInWithGoogle() async {
    final provider = GoogleAuthProvider()
      ..addScope('email')
      ..addScope('profile');

    final credential = kIsWeb
        ? await _auth.signInWithPopup(provider)
        : await _auth.signInWithProvider(provider);

    return _wrap(credential);
  }

  /// Apple sign-in is only published on iOS, macOS, and Web. Calling this on
  /// Android throws — guard the caller with `Platform.isIOS || kIsWeb`.
  Future<FirebaseSignInResult> signInWithApple() async {
    final provider = AppleAuthProvider()
      ..addScope('email')
      ..addScope('name');

    final credential = kIsWeb
        ? await _auth.signInWithPopup(provider)
        : await _auth.signInWithProvider(provider);

    return _wrap(credential);
  }

  bool get supportsApple => kIsWeb || (!kIsWeb && Platform.isIOS);

  Future<void> signOut() => _auth.signOut();

  Future<FirebaseSignInResult> _wrap(UserCredential cred) async {
    final user = cred.user;
    if (user == null) {
      throw FirebaseAuthException(
        code: 'no-user',
        message: 'Sign-in succeeded but no user was returned.',
      );
    }
    return FirebaseSignInResult(
      user: user,
      isNew: cred.additionalUserInfo?.isNewUser ?? false,
      idToken: await user.getIdToken(),
    );
  }
}

final firebaseAuthServiceProvider = Provider<FirebaseAuthService>(
  (ref) => FirebaseAuthService(ref.watch(firebaseAuthProvider)),
);
