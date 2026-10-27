import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/app_prefs.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/fallback.dart';
import '../../../shared/widgets/state_views.dart';

class AppLanguage {
  const AppLanguage({
    required this.code,
    required this.name,
    this.flag = '🌐',
    this.isRtl = false,
  });
  final String code;
  final String name;
  final String flag;
  final bool isRtl;
}

const _fallbackLanguages = <AppLanguage>[
  AppLanguage(code: 'en', name: 'English', flag: '🇬🇧'),
  AppLanguage(code: 'ar', name: 'Arabic',  flag: '🇸🇦', isRtl: true),
  AppLanguage(code: 'hi', name: 'Hindi',   flag: '🇮🇳'),
  AppLanguage(code: 'es', name: 'Spanish', flag: '🇪🇸'),
  AppLanguage(code: 'fr', name: 'French',  flag: '🇫🇷'),
  AppLanguage(code: 'de', name: 'German',  flag: '🇩🇪'),
];

const _flags = <String, String>{
  'en': '🇬🇧', 'ar': '🇸🇦', 'hi': '🇮🇳', 'es': '🇪🇸', 'fr': '🇫🇷',
  'de': '🇩🇪', 'pt': '🇵🇹', 'ru': '🇷🇺', 'zh': '🇨🇳', 'ja': '🇯🇵',
};

final languagesProvider = FutureProvider.autoDispose<List<AppLanguage>>(
  (ref) => withFallback(() async {
    final res = await ref.read(apiClientProvider).get('/languages');
    return res.list
        .map((e) => AppLanguage(
              code: e['code'] as String? ?? 'en',
              name: e['name'] as String? ?? '',
              flag: _flags[e['code']] ?? '🌐',
              isRtl: e['is_rtl'] == true,
            ))
        .toList();
  }, () => _fallbackLanguages),
);

class LanguageScreen extends ConsumerWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(languagesProvider);
    final active = ref.watch(appPrefsProvider).language;
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textDark),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Language',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w800,
            fontSize: 19,
          ),
        ),
        centerTitle: true,
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(languagesProvider),
        ),
        data: (langs) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: langs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) {
            final l = langs[i];
            final selected = l.code == active;
            return InkWell(
              onTap: () async {
                await ref.read(appPrefsProvider).setLanguage(l.code);
                syncPreference(ref, 'preferred_language', l.code);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Language set to ${l.name}')),
                  );
                  // Force a rebuild to update the trailing checkmark.
                  (context as Element).markNeedsBuild();
                }
              },
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: selected
                      ? Border.all(color: AppTheme.seed, width: 1.4)
                      : null,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Text(l.flag, style: const TextStyle(fontSize: 26)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l.name,
                            style: const TextStyle(
                              color: AppTheme.textDark,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            '${l.code.toUpperCase()}${l.isRtl ? ' · RTL' : ''}',
                            style: TextStyle(
                              color: AppTheme.textDark.withValues(alpha: 0.55),
                              fontSize: 12,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (selected)
                      const Icon(Icons.check_circle, color: AppTheme.seed, size: 24)
                    else
                      Icon(
                        Icons.radio_button_unchecked,
                        color: AppTheme.textDark.withValues(alpha: 0.3),
                        size: 24,
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
