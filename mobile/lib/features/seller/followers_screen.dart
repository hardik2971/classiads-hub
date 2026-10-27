import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../auth/data/user.dart';
import '../../shared/widgets/state_views.dart';

final _followProvider = FutureProvider.autoDispose.family<List<User>, String>((ref, path) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/$path');
      return res.list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
    },
    DummyData.users,
  );
});

class FollowersScreen extends StatelessWidget {
  const FollowersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Connections'),
          bottom: const TabBar(tabs: [Tab(text: 'Followers'), Tab(text: 'Following')]),
        ),
        body: const TabBarView(children: [_UserList(path: 'followers'), _UserList(path: 'following')]),
      ),
    );
  }
}

class _UserList extends ConsumerWidget {
  const _UserList({required this.path});
  final String path;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(_followProvider(path));
    return users.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(message: '$e'),
      data: (list) {
        if (list.isEmpty) return EmptyView(message: 'No $path yet', icon: Icons.people_outline);
        return ListView.separated(
          itemCount: list.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (_, i) {
            final u = list[i];
            return ListTile(
              leading: CircleAvatar(child: Text(u.name.isNotEmpty ? u.name[0].toUpperCase() : '?')),
              title: Row(children: [
                Flexible(child: Text(u.name)),
                if (u.isVerified) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.verified, size: 14, color: Colors.blue)),
              ]),
              trailing: const Icon(Icons.chevron_right),
            );
          },
        );
      },
    );
  }
}
