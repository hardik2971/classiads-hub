import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/storage/app_prefs.dart';

class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => _parse(ref.read(appPrefsProvider).themeMode);

  ThemeMode _parse(String s) => switch (s) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };

  Future<void> set(String mode) async {
    await ref.read(appPrefsProvider).setThemeMode(mode);
    state = _parse(mode);
  }
}

final themeModeProvider = NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);
