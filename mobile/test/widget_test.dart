import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:classiads_hub/core/storage/app_prefs.dart';
import 'package:classiads_hub/features/auth/screens/splash_screen.dart';

void main() {
  testWidgets('Splash screen renders branding', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [sharedPrefsProvider.overrideWithValue(prefs)],
        child: const MaterialApp(home: SplashScreen()),
      ),
    );

    expect(find.text('ClassiAds_Hub'), findsOneWidget);
  });
}
