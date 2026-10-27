
/// Static app configuration.
class AppConfig {
  static const String appName = 'ClassiAds Hub';

  /// Override at build time: --dart-define=API_BASE_URL=https://.../api/v1
  static const String _override = String.fromEnvironment('API_BASE_URL');

  /// Firebase Cloud Function `api`. Override with --dart-define=API_BASE_URL=... (e.g. the emulator).
  static String get apiBaseUrl =>
      _override.isNotEmpty ? _override : 'https://us-central1-classiadshub.cloudfunctions.net/api/v1';

  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration receiveTimeout = Duration(seconds: 20);

  /// Google Maps Platform API key. Used by:
  ///   * Android — `<meta-data android:name="com.google.android.geo.API_KEY">`
  ///   * iOS — `GMSServices.provideAPIKey()` in AppDelegate
  ///   * Web — `<script src="…/api/js?key=…">` in `web/index.html`
  ///   * Dart — direct geocoding / static map URL calls
  /// Override at build time with --dart-define=GOOGLE_MAPS_KEY=…
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_KEY',
    defaultValue: 'AIzaSyB53YOSHYscLVfwIVnAhnK8XsjYGD9vc1Y',
  );

  // Storage keys
  static const String kAuthToken = 'auth_token';
  static const String kOnboardingSeen = 'onboarding_seen';
  static const String kLanguage = 'pref_language';
  static const String kCurrency = 'pref_currency';
  static const String kThemeMode = 'pref_theme_mode';
  static const String kProfileAddress = 'profile_address';
  static const String kNotificationsEnabled = 'pref_notifications_enabled';
  static const String kShowContactInfo = 'pref_show_contact_info';
  static const String kLocationPrompted = 'location_prompted';
  static const String kLocationLabel = 'location_label';
}
