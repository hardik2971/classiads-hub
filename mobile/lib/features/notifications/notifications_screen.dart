import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../../core/utils/format.dart';
import '../../shared/widgets/state_views.dart';

class _Notif {
  _Notif(this.id, this.title, this.body, this.read, this.createdAt);
  final String id;
  final String? title;
  final String? body;
  final bool read;
  final String? createdAt;
  factory _Notif.fromJson(Map<String, dynamic> j) =>
      _Notif(j['id'].toString(), j['title'] as String?, j['body'] as String?, j['read'] == true, j['created_at'] as String?);
}

final _notificationsProvider = FutureProvider.autoDispose<List<_Notif>>((ref) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/notifications');
      return res.list.map((e) => _Notif.fromJson(e as Map<String, dynamic>)).toList();
    },
    () => DummyData.notifications().map((e) => _Notif.fromJson(e)).toList(),
  );
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifs = ref.watch(_notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              try {
                await ref.read(apiClientProvider).post('/notifications/read-all');
              } catch (_) {/* list refresh shows the real state */}
              ref.invalidate(_notificationsProvider);
            },
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: notifs.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(_notificationsProvider)),
        data: (list) {
          if (list.isEmpty) return const EmptyView(message: 'No notifications', icon: Icons.notifications_none);
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(_notificationsProvider.future),
            child: ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final n = list[i];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: n.read ? Colors.black12 : const Color(0x1A2563EB),
                    child: Icon(Icons.notifications, color: n.read ? Colors.black38 : const Color(0xFF272757), size: 20),
                  ),
                  title: Text(n.title ?? 'Notification', style: TextStyle(fontWeight: n.read ? FontWeight.normal : FontWeight.bold)),
                  subtitle: Text(n.body ?? ''),
                  trailing: Text(timeAgo(n.createdAt), style: const TextStyle(fontSize: 11, color: Colors.black45)),
                  onTap: n.read
                      ? null
                      : () async {
                          try {
                            await ref.read(apiClientProvider).post('/notifications/${n.id}/read');
                          } catch (_) {}
                          ref.invalidate(_notificationsProvider);
                        },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
