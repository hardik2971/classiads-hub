import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/dummy/dummy_data.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/fallback.dart';
import '../../../shared/widgets/state_views.dart';
import '../../auth/data/user.dart';

/// "Who bought?" — seller confirms the buyer of a sold ad (#22).
class WhoBoughtScreen extends ConsumerWidget {
  const WhoBoughtScreen({super.key, required this.adId});
  final int adId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final buyers = ref.watch(_buyersProvider(adId));

    Future<void> confirm(User u) async {
      try {
        await ref.read(apiClientProvider).post('/ads/$adId/confirm-buyer', body: {'buyer_id': u.id});
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${u.name} confirmed as buyer')));
          context.pop();
        }
      } on ApiException catch (e) {
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Who bought this?')),
      body: buyers.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e'),
        data: (list) {
          if (list.isEmpty) return const EmptyView(message: 'No interested buyers found', icon: Icons.people_outline);
          return ListView(
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Select the buyer who purchased this item. They can then leave you a review.'),
              ),
              ...list.map((u) => ListTile(
                    leading: CircleAvatar(child: Text(u.name.isNotEmpty ? u.name[0].toUpperCase() : '?')),
                    title: Text(u.name),
                    trailing: FilledButton(onPressed: () => confirm(u), child: const Text('Confirm')),
                  )),
            ],
          );
        },
      ),
    );
  }
}

final _buyersProvider = FutureProvider.autoDispose.family<List<User>, int>((ref, adId) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/ads/$adId/potential-buyers');
      return res.list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
    },
    DummyData.users,
  );
});
