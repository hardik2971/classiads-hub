import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/fallback.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/state_views.dart';

class Review {
  const Review({
    required this.id,
    required this.author,
    required this.body,
    required this.rating,
    required this.daysAgo,
  });
  final int id;
  final String author;
  final String body;
  final double rating;
  final int daysAgo;
}

List<Review> _dummyReviews() => const [
      Review(
        id: 1,
        author: 'Asgar WRTeam',
        body: 'Great communication and the item was exactly as described. Would buy again!',
        rating: 5,
        daysAgo: 2,
      ),
      Review(
        id: 2,
        author: 'Nandita',
        body: 'Smooth deal, met on time and the price was fair.',
        rating: 4.5,
        daysAgo: 5,
      ),
      Review(
        id: 3,
        author: 'Rahul Patel',
        body: 'Friendly seller, easy negotiation. Recommended.',
        rating: 5,
        daysAgo: 14,
      ),
    ];

final myReviewsProvider = FutureProvider.autoDispose<List<Review>>(
  (ref) => withFallback(() async {
    final res = await ref.read(apiClientProvider).get('/reviews/received');
    return res.list
        .map((e) => Review(
              id: (e['id'] as num).toInt(),
              author: (e['reviewer']?['name'] as String?) ?? 'Buyer',
              body: (e['comment'] ?? e['body']) as String? ?? '',
              rating: ((e['rating'] as num?)?.toDouble()) ?? 5.0,
              daysAgo: daysSince(e['created_at']),
            ))
        .toList();
  }, _dummyReviews),
);

class ReviewsScreen extends ConsumerWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myReviewsProvider);
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
        title: const Text(
          'My Reviews',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w800,
            fontSize: 19,
          ),
        ),
        centerTitle: true,
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e',
            onRetry: () => ref.invalidate(myReviewsProvider)),
        data: (list) {
          if (list.isEmpty) return const _NoData(title: 'No reviews yet');
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _ReviewCard(r: list[i]),
          );
        },
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.r});
  final Review r;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.seed.withValues(alpha: 0.12),
                child: Text(
                  r.author.isNotEmpty ? r.author[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppTheme.seed, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  r.author,
                  style: const TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _Stars(rating: r.rating),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            r.body,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.78),
              fontSize: 14,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${r.daysAgo}d ago',
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.45),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _Stars extends StatelessWidget {
  const _Stars({required this.rating});
  final double rating;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 1; i <= 5; i++)
          Icon(
            i <= rating
                ? Icons.star_rounded
                : (i - 0.5 <= rating
                    ? Icons.star_half_rounded
                    : Icons.star_border_rounded),
            color: AppTheme.accent,
            size: 18,
          ),
      ],
    );
  }
}

class _NoData extends StatelessWidget {
  const _NoData({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Image.asset('assets/emty-data.png', width: 260, height: 260, fit: BoxFit.contain),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: AppTheme.seed,
              fontSize: 21,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Nothing here yet. Check back later.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.65),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
