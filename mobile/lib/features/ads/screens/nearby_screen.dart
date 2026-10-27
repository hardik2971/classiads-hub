import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/paginated.dart';
import '../../../core/services/location_service.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/widgets/ad_card.dart';
import '../../../shared/widgets/state_views.dart';
import '../ads_repository.dart';

/// "Nearby Ads with KM Range" — resolves device GPS first, falls back to
/// Mumbai if permission is denied.
class NearbyScreen extends ConsumerStatefulWidget {
  const NearbyScreen({super.key});

  @override
  ConsumerState<NearbyScreen> createState() => _NearbyScreenState();
}

class _NearbyScreenState extends ConsumerState<NearbyScreen> {
  static const _fallbackLat = 19.0760, _fallbackLng = 72.8777; // Mumbai

  double _lat = _fallbackLat;
  double _lng = _fallbackLng;
  bool _usingFallback = true;
  double _radius = 25;
  Future<Paginated<Ad>>? _future;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final pos = await ref.read(locationServiceProvider).currentPosition();
    if (!mounted) return;
    setState(() {
      if (pos != null) {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _usingFallback = false;
      }
    });
    _run();
  }

  void _run() => setState(() =>
      _future = ref.read(adsRepositoryProvider).nearby(_lat, _lng, radius: _radius));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nearby Ads')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Icon(
                  _usingFallback ? Icons.location_off : Icons.my_location,
                  size: 18,
                  color: const Color(0xFF272757),
                ),
                const SizedBox(width: 6),
                Text('Within ${_radius.round()} km'),
                Expanded(
                  child: Slider(
                    value: _radius, min: 5, max: 200, divisions: 39,
                    label: '${_radius.round()} km',
                    onChanged: (v) => setState(() => _radius = v),
                    onChangeEnd: (_) => _run(),
                  ),
                ),
              ],
            ),
          ),
          if (_usingFallback)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
              child: Text(
                'Location unavailable — showing results around Mumbai.',
                style: TextStyle(
                  color: Colors.black.withValues(alpha: 0.55),
                  fontSize: 12,
                ),
              ),
            ),
          Expanded(
            child: FutureBuilder<Paginated<Ad>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) return const LoadingView();
                final ads = snap.data?.items ?? [];
                if (ads.isEmpty) return const EmptyView(message: 'No ads nearby', icon: Icons.location_off);
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 240, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
                  itemCount: ads.length,
                  itemBuilder: (_, i) {
                    final ad = ads[i];
                    return Stack(
                      children: [
                        AdCard(ad: ad),
                        if (ad.distanceKm != null)
                          Positioned(
                            right: 6, top: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(8)),
                              child: Text('${ad.distanceKm!.toStringAsFixed(1)} km', style: const TextStyle(color: Colors.white, fontSize: 10)),
                            ),
                          ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
