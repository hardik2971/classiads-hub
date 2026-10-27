import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

/// Overridden in main() with the resolved SharedPreferences instance.
final sharedPrefsProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPrefsProvider must be overridden'),
);

/// Non-sensitive local preferences.
class AppPrefs {
  AppPrefs(this._prefs);
  final SharedPreferences _prefs;

  bool get onboardingSeen => _prefs.getBool(AppConfig.kOnboardingSeen) ?? false;
  Future<void> setOnboardingSeen() => _prefs.setBool(AppConfig.kOnboardingSeen, true);

  String get language => _prefs.getString(AppConfig.kLanguage) ?? 'en';
  Future<void> setLanguage(String v) => _prefs.setString(AppConfig.kLanguage, v);

  String get currency => _prefs.getString(AppConfig.kCurrency) ?? 'USD';
  Future<void> setCurrency(String v) => _prefs.setString(AppConfig.kCurrency, v);

  /// 'system' | 'light' | 'dark'
  String get themeMode => _prefs.getString(AppConfig.kThemeMode) ?? 'system';
  Future<void> setThemeMode(String v) => _prefs.setString(AppConfig.kThemeMode, v);

  // ----- Profile-side prefs (no backend field — local persistence only) -----
  String get address => _prefs.getString(AppConfig.kProfileAddress) ?? '';
  Future<void> setAddress(String v) => _prefs.setString(AppConfig.kProfileAddress, v);

  bool get notificationsEnabled => _prefs.getBool(AppConfig.kNotificationsEnabled) ?? true;
  Future<void> setNotificationsEnabled(bool v) =>
      _prefs.setBool(AppConfig.kNotificationsEnabled, v);

  bool get showContactInfo => _prefs.getBool(AppConfig.kShowContactInfo) ?? true;
  Future<void> setShowContactInfo(bool v) => _prefs.setBool(AppConfig.kShowContactInfo, v);

  /// True once the user has answered the post-login location prompt
  /// (either picked auto-detect or chose another location).
  bool get locationPrompted => _prefs.getBool(AppConfig.kLocationPrompted) ?? false;
  Future<void> setLocationPrompted(bool v) =>
      _prefs.setBool(AppConfig.kLocationPrompted, v);

  String get locationLabel => _prefs.getString(AppConfig.kLocationLabel) ?? '';
  Future<void> setLocationLabel(String v) => _prefs.setString(AppConfig.kLocationLabel, v);
}

final appPrefsProvider = Provider<AppPrefs>((ref) => AppPrefs(ref.watch(sharedPrefsProvider)));
