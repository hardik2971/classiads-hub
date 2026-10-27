import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/paginated.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/widgets/ad_card.dart';
import '../../../shared/widgets/state_views.dart';
import '../ads_repository.dart';

final favoritesProvider = FutureProvider.autoDispose<Paginated<Ad>>(
  (ref) => ref.watch(adsRepositoryProvider).favorites(),
);

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favs = ref.watch(favoritesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: favs.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(favoritesProvider)),
        data: (page) {
          if (page.items.isEmpty) {
            return const EmptyView(message: 'No saved items', icon: Icons.favorite_border);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(favoritesProvider.future),
            child: GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 240, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
              itemCount: page.items.length,
              itemBuilder: (_, i) => AdCard(ad: page.items[i]),
            ),
          );
        },
      ),
    );
  }
}
