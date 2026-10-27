import 'package:flutter/material.dart';

/// Branding splash shown while the session bootstraps (router redirects out).
/// Icon-only on a clean white background — no app name, no tagline, no spinner.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset('assets/app-icon.png', width: 200, height: 200),
      ),
    );
  }
}
