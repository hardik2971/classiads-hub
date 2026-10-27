import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../../shared/widgets/state_views.dart';
import '../../shared/widgets/html_text.dart';

const _titles = {
  'about': 'About Us', 'terms': 'Terms & Conditions', 'privacy': 'Privacy Policy',
  'contact': 'Contact Us', 'faq': 'FAQ', 'refund': 'Refund Policy',
};

final _pageProvider = FutureProvider.autoDispose.family<({String title, String body}), String>((ref, key) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/pages/$key');
      return (title: res.map['title'] as String? ?? key, body: res.map['body'] as String? ?? '');
    },
    () => (
      title: _titles[key] ?? key,
      body: 'This is sample ${_titles[key] ?? key} content shown because live data could not be loaded.',
    ),
  );
});

class CmsPageScreen extends ConsumerWidget {
  const CmsPageScreen({super.key, required this.pageKey});
  final String pageKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(_pageProvider(pageKey));
    return Scaffold(
      appBar: AppBar(title: Text(page.value?.title ?? _titles[pageKey] ?? 'Page')),
      body: page.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e'),
        data: (p) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(p.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            HtmlText(p.body),
          ],
        ),
      ),
    );
  }
}
