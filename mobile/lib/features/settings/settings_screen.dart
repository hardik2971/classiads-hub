import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/app_prefs.dart';
import '../auth/data/auth_repository.dart';

final _languagesProvider = FutureProvider.autoDispose<List<({String code, String name})>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/languages');
  return res.list.map((e) => (code: e['code'] as String, name: e['name'] as String)).toList();
});
final _currenciesProvider = FutureProvider.autoDispose<List<({String code, String name})>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/currencies');
  return res.list.map((e) => (code: e['code'] as String, name: '${e['name']} (${e['code']})')).toList();
});

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(appPrefsProvider);
    final langs = ref.watch(_languagesProvider);
    final currencies = ref.watch(_currenciesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const _Header('Language'),
          langs.when(
            loading: () => const ListTile(title: Text('Loading…')),
            error: (_, __) => const ListTile(title: Text('Could not load languages')),
            data: (list) => ListTile(
              title: const Text('App language'),
              trailing: DropdownButton<String>(
                value: list.any((l) => l.code == prefs.language) ? prefs.language : null,
                hint: const Text('Select'),
                items: list.map((l) => DropdownMenuItem(value: l.code, child: Text(l.name))).toList(),
                onChanged: (v) async {
                  if (v != null) {
                    await prefs.setLanguage(v);
                    syncPreference(ref, 'preferred_language', v);
                    (context as Element).markNeedsBuild();
                  }
                },
              ),
            ),
          ),
          const _Header('Currency'),
          currencies.when(
            loading: () => const ListTile(title: Text('Loading…')),
            error: (_, __) => const ListTile(title: Text('Could not load currencies')),
            data: (list) => ListTile(
              title: const Text('Preferred currency'),
              trailing: DropdownButton<String>(
                value: list.any((c) => c.code == prefs.currency) ? prefs.currency : null,
                hint: const Text('Select'),
                items: list.map((c) => DropdownMenuItem(value: c.code, child: Text(c.code))).toList(),
                onChanged: (v) async {
                  if (v != null) {
                    await prefs.setCurrency(v);
                    syncPreference(ref, 'preferred_currency', v);
                    (context as Element).markNeedsBuild();
                  }
                },
              ),
            ),
          ),
          const _Header('About'),
          const ListTile(title: Text('ClassiAds Hub'), subtitle: Text('Version 1.0.0')),
        ],
      ),
    );
  }
}


class _Header extends StatelessWidget {
  const _Header(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
        child: Text(text, style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
      );
}
