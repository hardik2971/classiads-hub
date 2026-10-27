import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/paginated.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/widgets/state_views.dart';
import '../ads_repository.dart';

final myAdsProvider = FutureProvider.autoDispose<Paginated<Ad>>(
  (ref) => ref.watch(adsRepositoryProvider).myAds(),
);

enum _Filter { all, featured, live }

extension on _Filter {
  String get label => switch (this) {
        _Filter.all => 'All ads',
        _Filter.featured => 'Featured',
        _Filter.live => 'Live',
      };
}

class MyAdsScreen extends ConsumerStatefulWidget {
  const MyAdsScreen({super.key});

  @override
  ConsumerState<MyAdsScreen> createState() => _MyAdsScreenState();
}

class _MyAdsScreenState extends ConsumerState<MyAdsScreen> {
  _Filter _filter = _Filter.all;

  static const _statusColors = {
    'approved': Color(0xFF1F8A6B),
    'pending': Color(0xFFB57F00),
    'rejected': Color(0xFFD64545),
    'sold': Color(0xFF505081),
    'expired': Color(0xFF8A8A9C),
    'draft': Color(0xFF8A8A9C),
  };

  bool _matches(Ad ad) {
    switch (_filter) {
      case _Filter.all:
        return true;
      case _Filter.featured:
        return ad.isFeatured;
      case _Filter.live:
        return ad.status == 'approved';
    }
  }

  @override
  Widget build(BuildContext context) {
    final ads = ref.watch(myAdsProvider);
    final repo = ref.read(adsRepositoryProvider);

    Future<void> act(Future<void> Function() f, {String? confirm, String? done}) async {
      if (confirm != null) {
        final ok = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            content: Text(confirm),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes')),
            ],
          ),
        );
        if (ok != true) return;
      }
      try {
        await f();
        if (done != null && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(done)));
        }
      } catch (e) {
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
      ref.invalidate(myAdsProvider);
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'My Advertisement',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w800,
            fontSize: 22,
            letterSpacing: -0.3,
          ),
        ),
      ),
      body: Column(
        children: [
          _FilterBar(active: _filter, onChange: (f) => setState(() => _filter = f)),
          Expanded(
            child: ads.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(myAdsProvider),
              ),
              data: (page) {
                final filtered = page.items.where(_matches).toList();
                if (filtered.isEmpty) return const _NoData();
                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(myAdsProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 110),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _AdRow(
                      ad: filtered[i],
                      statusColor: _statusColors[filtered[i].status] ?? const Color(0xFF8A8A9C),
                      onEdit: () async {
                        await context.push('/ad-edit/${filtered[i].id}');
                        ref.invalidate(myAdsProvider);
                      },
                      onMarkSold: () => act(() => repo.markSold(filtered[i].id),
                          confirm: 'Mark "${filtered[i].title}" as sold?', done: 'Marked as sold'),
                      onWhoBought: () => context.push('/ad/${filtered[i].id}/who-bought'),
                      onRenew: () => act(() => repo.renew(filtered[i].id), done: 'Ad renewed'),
                      onDelete: () => act(() => repo.delete(filtered[i].id),
                          confirm: 'Delete "${filtered[i].title}"? This cannot be undone.', done: 'Ad deleted'),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ────────────────────────────── Filter pills ───────────────────────────────

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.active, required this.onChange});
  final _Filter active;
  final ValueChanged<_Filter> onChange;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      child: Row(
        children: [
          for (final f in _Filter.values) ...[
            _Pill(label: f.label, active: f == active, onTap: () => onChange(f)),
            if (f != _Filter.values.last) const SizedBox(width: 10),
          ],
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? AppTheme.seed : Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: active
                ? null
                : Border.all(color: Colors.black.withValues(alpha: 0.1)),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.white : AppTheme.textDark,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────── Empty state ─────────────────────────────────

class _NoData extends StatelessWidget {
  const _NoData();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(28, 28, 28, 28),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Image.asset(
            'assets/emty-data.png',
            width: 280,
            height: 280,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 18),
          const Text(
            'No Data Found',
            style: TextStyle(
              color: AppTheme.seed,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            "Sorry, we couldn't find what you were looking for.\nPlease try another search.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.7),
              fontSize: 15,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── Ad row card ─────────────────────────────────

class _AdRow extends StatelessWidget {
  const _AdRow({
    required this.ad,
    required this.statusColor,
    required this.onEdit,
    required this.onMarkSold,
    required this.onWhoBought,
    required this.onRenew,
    required this.onDelete,
  });

  final Ad ad;
  final Color statusColor;
  final VoidCallback onEdit;
  final VoidCallback onMarkSold;
  final VoidCallback onWhoBought;
  final VoidCallback onRenew;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final img = mediaUrl(ad.primaryImage);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push('/ad/${ad.slug}'),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 78,
                  height: 78,
                  child: img != null
                      ? CachedNetworkImage(imageUrl: img, fit: BoxFit.cover)
                      : Container(
                          color: AppTheme.backgroundLight,
                          child: const Icon(Icons.image_outlined,
                              color: AppTheme.seed),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            ad.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTheme.textDark,
                              fontSize: 15.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            ad.status,
                            style: TextStyle(
                              fontSize: 11,
                              color: statusColor,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      ad.priceDisplay ?? '—',
                      style: const TextStyle(
                        color: AppTheme.seed,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      '${ad.viewsCount} views',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppTheme.textDark.withValues(alpha: 0.55),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Wrap(
                      spacing: 4,
                      runSpacing: -8,
                      children: [
                        _Action(label: 'Edit', onTap: onEdit),
                        if (ad.status != 'sold')
                          _Action(label: 'Mark sold', onTap: onMarkSold),
                        if (ad.status == 'sold')
                          _Action(label: 'Who bought?', onTap: onWhoBought),
                        _Action(label: 'Renew', onTap: onRenew),
                        _Action(
                          label: 'Delete',
                          color: const Color(0xFFD64545),
                          onTap: onDelete,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.label, required this.onTap, this.color});
  final String label;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        foregroundColor: color ?? AppTheme.seed,
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
      child: Text(label),
    );
  }
}
