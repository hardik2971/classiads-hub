import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_exception.dart';
import 'data/auth_repository.dart';
import 'data/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState(this.status, [this.user]);
  final AuthStatus status;
  final User? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

/// Owns the session (a Firebase Auth session): restores it on launch, exposes the
/// current app profile, and handles login/register/logout. The router watches this.
class AuthController extends Notifier<AuthState> {
  late final AuthRepository _repo = ref.read(authRepositoryProvider);
  fb.FirebaseAuth get _auth => fb.FirebaseAuth.instance;

  @override
  AuthState build() {
    _bootstrap();
    return const AuthState(AuthStatus.unknown);
  }

  Future<void> _bootstrap() async {
    try {
      final fbUser = await _auth.authStateChanges().first;
      if (fbUser == null) {
        state = const AuthState(AuthStatus.unauthenticated);
        return;
      }
      state = AuthState(AuthStatus.authenticated, await _repo.me());
      _registerDevice();
    } catch (_) {
      await _auth.signOut().catchError((_) {});
      state = const AuthState(AuthStatus.unauthenticated);
    }
  }

  Future<void> _signIn(AuthSession session, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: session.authEmail, password: password);
    } on fb.FirebaseAuthException catch (e) {
      throw ApiException(e.message ?? 'Sign-in failed.');
    }
    state = AuthState(AuthStatus.authenticated, session.user);
    _registerDevice();
  }

  StreamSubscription<String>? _tokenRefresh;

  /// Best-effort: send this device's FCM token to the API so pushes reach it.
  /// Never blocks or fails the sign-in.
  void _registerDevice() {
    if (kIsWeb) return;
    final platform = defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
    Future<void> send(String? token) async {
      if (token == null || token.isEmpty || _auth.currentUser == null) return;
      try {
        await _repo.registerDevice(token, platform);
      } catch (e) {
        debugPrint('Device registration failed: $e');
      }
    }

    FirebaseMessaging.instance.getToken().then(send).catchError((_) {});
    _tokenRefresh ??= FirebaseMessaging.instance.onTokenRefresh.listen(send);
  }

  Future<void> login(String login, String password) async {
    await _signIn(await _repo.login(login, password), password);
  }

  Future<String?> register({
    required String name,
    String? email,
    String? phone,
    required String password,
  }) async {
    final r = await _repo.register(name: name, email: email, phone: phone, password: password);
    await _signIn(r.session, password);
    return r.debugOtp;
  }

  /// After a provider sign-in (Google/Apple) the API provisions the profile on /auth/me.
  Future<void> completeProviderSignIn() async {
    state = AuthState(AuthStatus.authenticated, await _repo.me());
    _registerDevice();
  }

  void setUser(User user) => state = AuthState(AuthStatus.authenticated, user);

  Future<void> refresh() async {
    try {
      state = AuthState(AuthStatus.authenticated, await _repo.me());
    } catch (_) {/* keep current */}
  }

  Future<void> logout() async {
    await _auth.signOut();
    state = const AuthState(AuthStatus.unauthenticated);
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
