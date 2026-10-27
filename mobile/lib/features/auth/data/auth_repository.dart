import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'user.dart';

/// Result of login/register: the profile + the e-mail to sign in to Firebase Auth with
/// (phone-only accounts get a synthetic one from the API).
class AuthSession {
  AuthSession(this.user, this.authEmail);
  final User user;
  final String authEmail;
}

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  Future<AuthSession> login(String login, String password) async {
    final res = await _api.post('/auth/login', body: {
      'login': login,
      'password': password,
    });
    return AuthSession(
      User.fromJson(res.map['user'] as Map<String, dynamic>),
      res.map['auth_email'] as String,
    );
  }

  /// Returns the session + optional debug OTP code (dev only).
  Future<({AuthSession session, String? debugOtp})> register({
    required String name,
    String? email,
    String? phone,
    required String password,
  }) async {
    final res = await _api.post('/auth/register', body: {
      'name': name,
      if (email != null && email.isNotEmpty) 'email': email,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      'password': password,
      'password_confirmation': password,
    });
    final otp = (res.map['otp'] as Map?)?['debug_code'] as String?;
    return (
      session: AuthSession(
        User.fromJson(res.map['user'] as Map<String, dynamic>),
        res.map['auth_email'] as String,
      ),
      debugOtp: otp,
    );
  }

  Future<String?> sendOtp(String identifier, String channel, String purpose) async {
    final res = await _api.post('/auth/otp/send', body: {
      'identifier': identifier,
      'channel': channel,
      'purpose': purpose,
    });
    return res.map['debug_code'] as String?;
  }

  Future<void> verifyOtp(String identifier, String purpose, String code) =>
      _api.post('/auth/otp/verify',
          body: {'identifier': identifier, 'purpose': purpose, 'code': code});

  Future<String?> forgotPassword(String login) async {
    final res = await _api.post('/auth/password/forgot', body: {'login': login});
    return res.map['debug_code'] as String?;
  }

  Future<void> resetPassword(String login, String code, String password) =>
      _api.post('/auth/password/reset', body: {
        'login': login,
        'code': code,
        'password': password,
        'password_confirmation': password,
      });

  Future<User> me() async {
    final res = await _api.get('/auth/me');
    return User.fromJson(res.map);
  }

  /// JSON update, or multipart when an [avatar] file is attached (field `avatar`).
  Future<User> updateProfile(Map<String, dynamic> data, {MultipartFile? avatar}) async {
    final ApiResult res;
    if (avatar == null) {
      res = await _api.put('/auth/profile', body: data);
    } else {
      final form = FormData.fromMap({
        for (final e in data.entries)
          if (e.value != null) e.key: e.value,
        'avatar': avatar,
      });
      res = await _api.putMultipart('/auth/profile', form);
    }
    return User.fromJson(res.map);
  }


  /// Registers this device's FCM token so the API can push to it (POST /auth/devices).
  Future<void> registerDevice(String fcmToken, String platform) =>
      _api.post('/auth/devices', body: {'fcm_token': fcmToken, 'platform': platform});

  Future<void> deleteAccount(String password) =>
      _api.delete('/auth/account', body: {'password': password});
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

/// Mirror a locally-saved preference (language/currency) to the signed-in
/// profile. Best-effort: guests and offline failures keep the local value only.
void syncPreference(WidgetRef ref, String field, String value) {
  if (fb.FirebaseAuth.instance.currentUser == null) return;
  ref.read(authRepositoryProvider).updateProfile({field: value}).ignore();
}
