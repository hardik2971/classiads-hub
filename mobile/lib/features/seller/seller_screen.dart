import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/utils/format.dart';
import '../../shared/models/ad.dart';
import '../../shared/widgets/ad_card.dart';
import '../../shared/widgets/state_views.dart';
import '../auth/auth_controller.dart';

class SellerScreen extends ConsumerStatefulWidget {
  const SellerScreen({super.key, required this.id});
  final int id;

  @override
  ConsumerState<SellerScreen> createState() => _SellerScreenState();
}

class _SellerScreenState extends ConsumerState<SellerScreen> {
  Map<String, dynamic>? _profile;
  List<Ad> _ads = [];
  bool _loading = true;
  bool _following = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = ref.read(apiClientProvider);
    try {
      final p = await api.get('/sellers/${widget.id}');
      final a = await api.get('/sellers/${widget.id}/ads');
      if (mounted) {
        setState(() {
          _profile = p.map;
          _following = p.map['is_following'] == true;
          _ads = a.list.map((e) => Ad.fromJson(e as Map<String, dynamic>)).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = '$e';
        });
      }
    }
  }

  Future<void> _toggleFollow() async {
    if (ref.read(authControllerProvider).status != AuthStatus.authenticated) {
      context.push('/login?next=${Uri.encodeComponent('/seller/${widget.id}')}');
      return;
    }
    try {
      final res = await ref.read(apiClientProvider).post('/sellers/${widget.id}/follow');
      final following = res.map['following'] == true;
      if (!mounted) return;
      setState(() {
        final followers = ((_profile?['followers'] as num?) ?? 0).toInt();
        if (following != _following && _profile != null) {
          _profile!['followers'] = followers + (following ? 1 : -1);
        }
        _following = following;
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final seller = _profile?['seller'] as Map<String, dynamic>?;
    final name = seller?['name'] as String? ?? 'Seller';
    final isMe = ref.watch(authControllerProvider).user?.id == widget.id;
    final ratingAvg = ((_profile?['rating_avg'] as num?) ?? 0).toDouble();
    final ratingCount = ((_profile?['rating_count'] as num?) ?? 0).toInt();
    final avatar = mediaUrl(seller?['avatar_path'] as String?);
    return Scaffold(
      appBar: AppBar(title: const Text('Seller')),
      body: _loading
          ? const LoadingView()
          : _error != null
          ? ErrorView(message: _error!, onRetry: () {
              setState(() {
                _loading = true;
                _error = null;
              });
              _load();
            })
          : ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundImage: avatar != null ? CachedNetworkImageProvider(avatar) : null,
                        child: avatar != null ? null : Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(fontSize: 24)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Flexible(child: Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
                              if (seller?['is_verified'] == true) const Padding(padding: EdgeInsets.only(left: 6), child: Icon(Icons.verified, color: Colors.blue, size: 18)),
                            ]),
                            const SizedBox(height: 4),
                            Text(
                              ratingCount == 0
                                  ? 'No reviews yet'
                                  : '⭐ ${ratingAvg.toStringAsFixed(1)} ($ratingCount ${ratingCount == 1 ? 'review' : 'reviews'})',
                              style: const TextStyle(color: Colors.black54),
                            ),
                          ],
                        ),
                      ),
                      if (!isMe)
                        FilledButton(
                          onPressed: _toggleFollow,
                          // Theme buttons are full-width; size this one to its label inside the Row.
                          style: FilledButton.styleFrom(
                            minimumSize: const Size(96, 44),
                            backgroundColor: _following ? Colors.grey : null,
                          ),
                          child: Text(_following ? 'Following' : 'Follow'),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _stat('${_profile?['live_ads'] ?? 0}', 'Ads'),
                      _stat('${_profile?['followers'] ?? 0}', 'Followers'),
                      _stat('${_profile?['following'] ?? 0}', 'Following'),
                    ],
                  ),
                ),
                if (!isMe)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await context.push('/seller/${widget.id}/review');
                      _load(); // reflect the new rating
                    },
                    icon: const Icon(Icons.rate_review_outlined),
                    label: const Text('Write a review'),
                  ),
                ),
                const Padding(padding: EdgeInsets.all(16), child: Text('Live Ads', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                if (_ads.isEmpty)
                  const Padding(padding: EdgeInsets.all(24), child: EmptyView(message: 'No active listings'))
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 240, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
                    itemCount: _ads.length,
                    itemBuilder: (_, i) => AdCard(ad: _ads[i]),
                  ),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  Widget _stat(String value, String label) => Padding(
        padding: const EdgeInsets.only(right: 24),
        child: Column(children: [Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), Text(label, style: const TextStyle(color: Colors.black54, fontSize: 12))]),
      );
}
