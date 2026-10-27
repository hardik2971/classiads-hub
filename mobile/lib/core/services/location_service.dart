import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

/// Thin wrapper around `geolocator` + `geocoding`. Returns null instead of
/// throwing so call-sites can render a fallback UI without try/catch.
class LocationService {
  const LocationService();

  /// Resolves the device location after asking for permission.
  /// Returns null when the user denies or location services are off.
  Future<Position?> currentPosition({
    LocationAccuracy accuracy = LocationAccuracy.medium,
  }) async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return null;

    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied ||
        perm == LocationPermission.deniedForever) {
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: accuracy,
          // Without a limit this never completes when the device has no GPS fix.
          timeLimit: const Duration(seconds: 12),
        ),
      );
    } catch (_) {
      // Last-known is fine for the city-label use case.
      return Geolocator.getLastKnownPosition();
    }
  }

  /// Best-effort reverse-geocode → "City, Country" string, or null.
  Future<String?> describe(double lat, double lng) async {
    try {
      final places = await placemarkFromCoordinates(lat, lng)
          .timeout(const Duration(seconds: 8));
      if (places.isEmpty) return null;
      final p = places.first;
      final city = [p.locality, p.subAdministrativeArea, p.administrativeArea]
          .where((s) => s != null && s.isNotEmpty)
          .firstOrNull;
      final country = p.country;
      return [city, country].where((s) => s != null && s.isNotEmpty).join(', ');
    } catch (_) {
      return null;
    }
  }
}

final locationServiceProvider = Provider<LocationService>(
  (_) => const LocationService(),
);
