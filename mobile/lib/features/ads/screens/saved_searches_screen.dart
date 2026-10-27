import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/utils/fallback.dart';
import '../../../shared/widgets/state_views.dart';

class _Saved {
  _Saved(this.id, this.name, this.query);
  final int id;
  final String name;
  final Map<String, dynamic> query;
  factory _Saved.fromJson(Map<String, dynamic> j) => _Saved(
        (j['id'] as num).toInt(),
        j['name'] as String? ?? 'Saved search',
        (j['query'] as Map?)?.cast<String, dynamic>() ?? {},
      );
}

final _savedProvider = FutureProvider.autoDispose<List<_Saved>>((ref) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/saved-searches');
      return res.list.map((e) => _Saved.fromJson(e as Map<String, dynamic>)).toList();
    },
    () => [
      _Saved(1, 'Cheap phones', {'q': 'phone', 'price_max': 900}),
      _Saved(2, 'Cars in Mumbai', {'category_slug': 'cars-vehicles'}),
    ],
  );
});

class SavedSearchesScreen extends ConsumerWidget {
  const SavedSearchesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(_savedProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Saved Searches')),
      body: saved.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e'),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyView(message: 'No saved searches', icon: Icons.bookmark_border);
          }
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final s = list[i];
              return ListTile(
                leading: const Icon(Icons.saved_search),
                title: Text(s.name),
                subtitle: Text(s.query.entries.map((e) => '${e.key}: ${e.value}').join(' · ')),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.play_arrow),
                      tooltip: 'Run',
                      onPressed: () => context.push('/search?q=${Uri.encodeComponent(s.query['q']?.toString() ?? '')}'),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline),
                      tooltip: 'Delete',
                      onPressed: () async {
                        try {
                          await ref.read(apiClientProvider).delete('/saved-searches/${s.id}');
                        } catch (_) {}
                        ref.invalidate(_savedProvider);
                      },
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
