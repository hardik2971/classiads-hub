import 'package:flutter/material.dart';

/// ClassiAds_Hub design system. Material 3, seeded from the brand navy.
class AppTheme {
  // Brand palette (shared with web + admin).
  static const Color seed = Color(0xFF272757);              // Primary
  static const Color secondary = Color(0xFF505081);         // Secondary
  static const Color accent = Color(0xFFFFBF00);            // Accent / buttons
  static const Color backgroundLight = Color(0xFFE4E4EE);   // Background Light
  static const Color textDark = Color(0xFF0F0E47);          // Text Dark

  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isLight = brightness == Brightness.light;
    final scheme = ColorScheme.fromSeed(
      seedColor: seed,
      brightness: brightness,
    ).copyWith(
      primary: seed,
      onPrimary: Colors.white,
      secondary: secondary,
      onSecondary: Colors.white,
      tertiary: accent,
      onTertiary: textDark, // dark text on amber for WCAG AAA
      surface: isLight ? Colors.white : null,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: isLight ? backgroundLight : scheme.surface,
      appBarTheme: AppBarTheme(
        backgroundColor: isLight ? Colors.white : scheme.surface,
        foregroundColor: isLight ? textDark : scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: isLight ? Colors.white : scheme.surfaceContainerHighest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isLight ? Colors.white : scheme.surfaceContainerHighest,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.primary, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: isLight ? Colors.white : scheme.surface,
        indicatorColor: scheme.primary.withValues(alpha: 0.12),
        height: 64,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
