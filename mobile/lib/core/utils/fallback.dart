import 'package:flutter/foundation.dart';

/// Runs [fetch]; if it throws (e.g. the API is unreachable), returns [dummy]
/// so the UI can always render content. Used across repositories per the
/// "show dummy data when the real data can't be fetched" requirement.
Future<T> withFallback<T>(Future<T> Function() fetch, T Function() dummy) async {
  try {
    return await fetch();
  } catch (e) {
    if (kDebugMode) debugPrint('[fallback] using dummy data: $e');
    return dummy();
  }
}
