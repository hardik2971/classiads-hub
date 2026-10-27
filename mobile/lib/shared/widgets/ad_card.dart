import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/format.dart';
import '../models/ad.dart';

class AdCard extends StatelessWidget {
  const AdCard({super.key, required this.ad, this.width});
  final Ad ad;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final img = mediaUrl(ad.primaryImage);
    final card = Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () => context.push('/ad/${ad.slug}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: img != null
                      ? CachedNetworkImage(
                          imageUrl: img,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: Colors.black12),
                          errorWidget: (_, __, ___) => const _Placeholder(),
                        )
                      : const _Placeholder(),
                ),
                if (ad.isFeatured)
                  Positioned(
                    left: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFBF00),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('★ Featured',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ad.priceDisplay ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF272757), fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(ad.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: Text(ad.cityName ?? '—',
                            maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: Colors.black54)),
                      ),
                      Text(timeAgo(ad.publishedAt), style: const TextStyle(fontSize: 11, color: Colors.black45)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
    return width != null ? SizedBox(width: width, child: card) : card;
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder();
  @override
  Widget build(BuildContext context) =>
      Container(color: Colors.black12, child: const Center(child: Icon(Icons.image, size: 36, color: Colors.black26)));
}
