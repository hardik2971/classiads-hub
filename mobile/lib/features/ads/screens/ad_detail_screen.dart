import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/widgets/ad_banner.dart';
import '../../../shared/widgets/state_views.dart';
import '../../auth/auth_controller.dart';
import '../ads_repository.dart';

class AdDetailScreen extends ConsumerStatefulWidget {
  const AdDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<AdDetailScreen> createState() => _AdDetailScreenState();
}

class _AdDetailScreenState extends ConsumerState<AdDetailScreen> {
  Future<Ad>? _ad;
  bool _favorited = false;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    final repo = ref.read(adsRepositoryProvider);
    _ad = repo.show(widget.slug).then((a) {
      _favorited = a.isFavorited;
      return a;
    });
  }

  bool _requireAuth() {
    if (ref.read(authControllerProvider).status != AuthStatus.authenticated) {
      context.push('/login?next=${Uri.encodeComponent('/ad/${widget.slug}')}');
      return false;
    }
    return true;
  }

  Future<void> _toggleFav(Ad ad) async {
    if (!_requireAuth()) return;
    try {
      final v = await ref.read(adsRepositoryProvider).toggleFavorite(ad.id);
      if (mounted) setState(() => _favorited = v);
    } catch (e) {
      _snack('$e');
    }
  }

  Future<void> _chat(Ad ad) async {
    if (!_requireAuth()) return;
    try {
      final id = await ref.read(adsRepositoryProvider).startConversation(ad.id);
      if (mounted) context.push('/conversations/$id');
    } catch (e) {
      _snack('$e');
    }
  }

  Future<void> _offer(Ad ad) async {
    if (!_requireAuth()) return;
    final ctrl = TextEditingController();
    final amount = await showDialog<String>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Make an offer'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'Your offer',
            helperText: ad.priceDisplay != null ? 'Asking: ${ad.priceDisplay}' : null,
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogCtx), child: const Text('Cancel')),
          FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size(88, 44)),
              onPressed: () => Navigator.pop(dialogCtx, ctrl.text),
              child: const Text('Send')),
        ],
      ),
    );
    if (amount == null || amount.trim().isEmpty) return;
    final value = num.tryParse(amount.trim().replaceAll(',', ''));
    if (value == null || value <= 0) {
      _snack('Enter a valid amount');
      return;
    }
    try {
      await ref.read(adsRepositoryProvider).makeOffer(ad.id, value);
      _snack('Offer sent!');
    } catch (e) {
      _snack('$e');
    }
  }

  void _snack(String m) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    }
  }

  void _share(Ad ad) {
    Clipboard.setData(ClipboardData(text: 'https://classiadshub.web.app/ad/${ad.slug}'));
    _snack('Link copied to clipboard');
  }

  Future<void> _report(Ad ad) async {
    if (!_requireAuth()) return;
    String reason = 'spam';
    final details = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('Report this ad'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: reason,
                decoration: const InputDecoration(labelText: 'Reason'),
                items: const [
                  DropdownMenuItem(value: 'spam', child: Text('Spam')),
                  DropdownMenuItem(value: 'scam', child: Text('Scam / fraud')),
                  DropdownMenuItem(value: 'prohibited', child: Text('Prohibited item')),
                  DropdownMenuItem(value: 'offensive', child: Text('Offensive content')),
                  DropdownMenuItem(value: 'other', child: Text('Other')),
                ],
                onChanged: (v) => setLocal(() => reason = v ?? 'spam'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: details,
                decoration: const InputDecoration(labelText: 'Details (optional)'),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel')),
            FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size(88, 44)),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Submit')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(adsRepositoryProvider).report('ad', ad.id, reason, details: details.text);
      _snack('Reported. Thank you.');
    } catch (e) {
      _snack('$e');
    }
  }

  @override
  Widget build(BuildContext context) {
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
        actions: [
          FutureBuilder<Ad>(
            future: _ad,
            builder: (_, snap) => IconButton(
              icon: const Icon(Icons.share_outlined, color: AppTheme.textDark),
              onPressed: snap.data == null ? null : () => _share(snap.data!),
            ),
          ),
        ],
      ),
      body: FutureBuilder<Ad>(
        future: _ad,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingView();
          }
          if (snap.hasError || snap.data == null) {
            return ErrorView(message: '${snap.error ?? 'Not found'}');
          }
          final ad = snap.data!;
          return _AdBody(
            ad: ad,
            favorited: _favorited,
            page: _page,
            onPageChanged: (i) => setState(() => _page = i),
            onToggleFav: () => _toggleFav(ad),
            onReport: () => _report(ad),
          );
        },
      ),
      bottomNavigationBar: FutureBuilder<Ad>(
        future: _ad,
        builder: (context, snap) {
          final ad = snap.data;
          if (ad == null) return const SizedBox.shrink();
          final me = ref.read(authControllerProvider).user;
          if (me != null && ad.seller?.id == me.id) {
            // Own ad: no offer/chat with yourself — offer editing instead.
            return SafeArea(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                child: SizedBox(
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: () => context.push('/ad-edit/${ad.id}'),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit ad'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.seed,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ),
            );
          }
          return _BottomActions(
            onOffer: () => _offer(ad),
            onChat: () => _chat(ad),
          );
        },
      ),
    );
  }
}

// ───────────────────────────── Body ──────────────────────────────

class _AdBody extends StatelessWidget {
  const _AdBody({
    required this.ad,
    required this.favorited,
    required this.page,
    required this.onPageChanged,
    required this.onToggleFav,
    required this.onReport,
  });

  final Ad ad;
  final bool favorited;
  final int page;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onToggleFav;
  final VoidCallback onReport;

  String _publishedDate() {
    if (ad.publishedAt == null) return '';
    final d = DateTime.tryParse(ad.publishedAt!);
    return d == null ? '' : DateFormat('d MMM yyyy').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final images = ad.images.map((i) => mediaUrl(i.url)).whereType<String>().toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _Hero(
          images: images,
          favorited: favorited,
          page: page,
          onPageChanged: onPageChanged,
          onToggleFav: onToggleFav,
        ),
        const SizedBox(height: 18),
        Text(
          ad.title,
          style: const TextStyle(
            color: AppTheme.textDark,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
            height: 1.25,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          ad.priceDisplay ?? '—',
          style: const TextStyle(
            color: AppTheme.seed,
            fontSize: 28,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            const Icon(Icons.location_on_outlined, color: AppTheme.seed, size: 18),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                <String?>[ad.cityName, ad.countryName]
                    .whereType<String>()
                    .where((e) => e.isNotEmpty)
                    .join(', '),
                style: TextStyle(
                  color: AppTheme.textDark.withValues(alpha: 0.65),
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _publishedDate(),
              style: TextStyle(
                color: AppTheme.textDark.withValues(alpha: 0.65),
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const AdBannerPlaceholder(),
        if (ad.customFields.isNotEmpty) ...[
          const SizedBox(height: 14),
          _SpecsGrid(fields: ad.customFields),
        ],
        const SizedBox(height: 8),
        const Divider(height: 32, color: Color(0xFFD5D5DD)),
        const Text(
          'About this advertisement',
          style: TextStyle(
            color: AppTheme.textDark,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          ad.description.isNotEmpty
              ? ad.description
              : 'No description provided by the seller.',
          style: TextStyle(
            color: AppTheme.textDark.withValues(alpha: 0.65),
            fontSize: 15,
            height: 1.55,
          ),
        ),
        const SizedBox(height: 18),
        if (ad.seller != null) _SellerCard(ad: ad),
        const SizedBox(height: 18),
        const Text(
          'Location',
          style: TextStyle(
            color: AppTheme.textDark,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        _LocationMap(ad: ad),
        const SizedBox(height: 16),
        const AdBannerPlaceholder(),
        const SizedBox(height: 14),
        _ReportCard(ad: ad, onReport: onReport),
      ],
    );
  }
}

// ───────────────────────────── Hero ──────────────────────────────

class _Hero extends StatelessWidget {
  const _Hero({
    required this.images,
    required this.favorited,
    required this.page,
    required this.onPageChanged,
    required this.onToggleFav,
  });

  final List<String> images;
  final bool favorited;
  final int page;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onToggleFav;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: SizedBox(
        height: 260,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (images.isEmpty)
              Container(
                color: AppTheme.backgroundLight,
                child: const Icon(Icons.image_outlined, size: 64, color: AppTheme.seed),
              )
            else
              PageView.builder(
                onPageChanged: onPageChanged,
                itemCount: images.length,
                itemBuilder: (_, i) => GestureDetector(
                  onTap: () => context.push('/gallery',
                      extra: {'images': images, 'index': i}),
                  child: CachedNetworkImage(imageUrl: images[i], fit: BoxFit.cover),
                ),
              ),
            // Heart button (top-right)
            Positioned(
              top: 12,
              right: 12,
              child: Material(
                color: Colors.white,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onToggleFav,
                  child: SizedBox(
                    width: 44,
                    height: 44,
                    child: Icon(
                      favorited ? Icons.favorite : Icons.favorite_border,
                      color: AppTheme.seed,
                      size: 22,
                    ),
                  ),
                ),
              ),
            ),
            // Dot indicators
            if (images.length > 1)
              Positioned(
                bottom: 10,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(images.length, (i) {
                    final active = i == page;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      height: 7,
                      width: active ? 18 : 7,
                      decoration: BoxDecoration(
                        color: active ? Colors.white : Colors.white70,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────── Specs Grid ────────────────────────

class _SpecsGrid extends StatelessWidget {
  const _SpecsGrid({required this.fields});
  final List<AdFieldValue> fields;

  IconData _iconFor(String name) {
    final n = name.toLowerCase();
    if (n.contains('gender') || n.contains('sex')) return Icons.transgender;
    if (n.contains('age')) return Icons.cake_outlined;
    if (n.contains('color') || n.contains('pattern')) return Icons.palette_outlined;
    if (n.contains('size') || n.contains('weight') || n.contains('height')) return Icons.straighten;
    if (n.contains('vaccin')) return Icons.vaccines_outlined;
    if (n.contains('health')) return Icons.monitor_heart_outlined;
    if (n.contains('registration') || n.contains('papers')) return Icons.workspace_premium_outlined;
    if (n.contains('behavior') || n.contains('temperament')) return Icons.pets;
    if (n.contains('breed')) return Icons.flag_outlined;
    if (n.contains('brand')) return Icons.branding_watermark_outlined;
    if (n.contains('model')) return Icons.devices_other_outlined;
    if (n.contains('year')) return Icons.event_outlined;
    if (n.contains('condition')) return Icons.check_circle_outline;
    if (n.contains('mileage') || n.contains('km')) return Icons.speed_outlined;
    if (n.contains('fuel')) return Icons.local_gas_station_outlined;
    if (n.contains('transmission')) return Icons.settings_outlined;
    if (n.contains('bedroom') || n.contains('room')) return Icons.king_bed_outlined;
    if (n.contains('bathroom')) return Icons.bathroom_outlined;
    if (n.contains('area')) return Icons.square_foot_outlined;
    return Icons.label_outline;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (ctx, constraints) {
      const cols = 2;
      const gap = 12.0;
      final cellWidth = (constraints.maxWidth - gap) / cols;
      return Wrap(
        spacing: gap,
        runSpacing: 16,
        children: [
          for (final f in fields)
            SizedBox(
              width: cellWidth,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.seed.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Icon(_iconFor(f.name), color: AppTheme.seed, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          f.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: AppTheme.textDark.withValues(alpha: 0.55),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          f.value,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppTheme.textDark,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      );
    });
  }
}

// ───────────────────────────── Seller Card ─────────────────────────

class _SellerCard extends StatelessWidget {
  const _SellerCard({required this.ad});
  final Ad ad;

  @override
  Widget build(BuildContext context) {
    final seller = ad.seller!;
    return InkWell(
      onTap: () => context.push('/seller/${seller.id}'),
      borderRadius: BorderRadius.circular(14),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFF1F8A6B).withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            clipBehavior: Clip.antiAlias,
            child: mediaUrl(seller.avatarPath) != null
                ? CachedNetworkImage(
                    imageUrl: mediaUrl(seller.avatarPath)!,
                    width: 64,
                    height: 64,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) =>
                        const Icon(Icons.person, color: Color(0xFF1F8A6B), size: 34),
                  )
                : const Icon(Icons.person, color: Color(0xFF1F8A6B), size: 34),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (seller.isVerified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD64545),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.shield, color: Colors.white, size: 13),
                        SizedBox(width: 4),
                        Text(
                          'VERIFIED',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (seller.isVerified) const SizedBox(height: 6),
                Text(
                  seller.name,
                  style: const TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppTheme.textDark, size: 16),
                    const SizedBox(width: 3),
                    Text(
                      seller.ratingCount == 0 ? 'New' : seller.ratingAvg.toStringAsFixed(1),
                      style: TextStyle(
                        color: AppTheme.textDark,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(width: 1, height: 12, color: Colors.black26),
                    const SizedBox(width: 8),
                    Text(
                      '${seller.ratingCount} ${seller.ratingCount == 1 ? 'Rating' : 'Ratings'}',
                      style: TextStyle(
                        color: AppTheme.textDark.withValues(alpha: 0.6),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── Location Map ────────────────────────

class _LocationMap extends StatelessWidget {
  const _LocationMap({required this.ad});
  final Ad ad;

  @override
  Widget build(BuildContext context) {
    final lat = ad.latitude;
    final lng = ad.longitude;

    // Graceful fallback when the ad has no geo-coords.
    if (lat == null || lng == null) {
      return Container(
        height: 180,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.location_off_outlined,
                color: AppTheme.textDark.withValues(alpha: 0.5), size: 28),
            const SizedBox(height: 8),
            Text(
              ad.cityName ?? 'Location not provided',
              style: TextStyle(
                color: AppTheme.textDark.withValues(alpha: 0.7),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    final pos = LatLng(lat, lng);
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        height: 200,
        child: Stack(
          children: [
            GoogleMap(
              initialCameraPosition: CameraPosition(target: pos, zoom: 14),
              markers: {
                Marker(
                  markerId: const MarkerId('ad-location'),
                  position: pos,
                  infoWindow: InfoWindow(
                    title: ad.title,
                    snippet: ad.cityName,
                  ),
                ),
              },
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              mapToolbarEnabled: false,
              compassEnabled: false,
              liteModeEnabled: false,
              gestureRecognizers: const {},
              onTap: (_) => _openExternal(lat, lng),
            ),
            // Tap-to-open hint pinned bottom-left.
            Positioned(
              left: 10,
              bottom: 10,
              child: GestureDetector(
                onTap: () => _openExternal(lat, lng),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_on,
                          color: AppTheme.seed, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        ad.cityName ?? 'Open in Maps',
                        style: const TextStyle(
                          color: AppTheme.textDark,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openExternal(double lat, double lng) async {
    // Hand off to the platform's default map app via a deep link. We don't
    // pull in url_launcher to keep the dep surface small; this no-ops when
    // no scheme handler is registered (e.g. CI emulator without browser).
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    await SystemChannels.platform.invokeMethod<void>(
      'SystemNavigator.routeUpdated',
      <String, dynamic>{'location': uri.toString(), 'state': null},
    );
  }
}

// ───────────────────────────── Report card ─────────────────────────

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.ad, required this.onReport});
  final Ad ad;
  final VoidCallback onReport;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Did you find any problem with this ad?',
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.85),
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                'ID #${ad.id}',
                style: const TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: onReport,
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFFFBE0DC),
                  foregroundColor: const Color(0xFFD64545),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
                child: const Text('Report this ad'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── Bottom Actions ──────────────────────

class _BottomActions extends StatelessWidget {
  const _BottomActions({required this.onOffer, required this.onChat});
  final VoidCallback onOffer;
  final VoidCallback onChat;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: onOffer,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.seed,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    textStyle:
                        const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Make an offer'),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: onChat,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.seed,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    textStyle:
                        const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Chat'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
