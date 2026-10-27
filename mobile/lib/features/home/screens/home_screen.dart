import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/app_prefs.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../shared/models/category.dart';
import '../../../shared/widgets/ad_banner.dart';
import '../../../shared/widgets/ad_card.dart';
import '../../../shared/widgets/state_views.dart';
import '../../auth/auth_controller.dart';
import '../home_repository.dart';

/// Lightweight icon mapping per category slug.
const _categoryIcon = <String, IconData>{
  'real-estate': Icons.house_outlined,
  'residential-properties': Icons.house_outlined,
  'cars-vehicles': Icons.directions_car_outlined,
  'automotive-vehicles': Icons.directions_car_outlined,
  'mobile-phones-tablets': Icons.smartphone_outlined,
  'smartphones': Icons.smartphone_outlined,
  'electronics': Icons.tv_outlined,
  'tvs-home-theater': Icons.tv_outlined,
  'audio-headphones': Icons.headphones_outlined,
  'home-appliances': Icons.kitchen_outlined,
  'smart-home-devices': Icons.lightbulb_outline,
  'washing-machines': Icons.local_laundry_service_outlined,
  'office-furniture': Icons.chair_outlined,
  'furniture-home-garden': Icons.chair_outlined,
  'clothing-accessories': Icons.checkroom_outlined,
  'footwear': Icons.hiking_outlined,
  'jewelry-watches': Icons.diamond_outlined,
  'cameras-imaging': Icons.camera_alt_outlined,
  'consoles-video-games': Icons.sports_esports_outlined,
  'musical-instruments': Icons.music_note_outlined,
  'sports-equipment': Icons.sports_basketball_outlined,
  'pets': Icons.pets_outlined,
  'jobs': Icons.work_outline,
  'classifieds': Icons.local_offer_outlined,
};

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final home = ref.watch(homeProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.refresh(homeProvider.future),
          child: home.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(
              message: '$e',
              onRetry: () => ref.invalidate(homeProvider),
            ),
            data: (data) => CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(child: _LocationCard()),
                SliverToBoxAdapter(child: _SearchBar()),
                if (data.categories.isNotEmpty)
                  SliverToBoxAdapter(child: _CategoryChips(categories: data.categories)),
                if (data.sliders.isNotEmpty)
                  SliverToBoxAdapter(child: _HeroBanner(sliders: data.sliders))
                else
                  const SliverToBoxAdapter(child: _HeroFallback()),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
                if (data.categories.isNotEmpty) ...[
                  const SliverToBoxAdapter(
                    child: _SectionTitle('Popular Categories', viewAllRoute: '/categories'),
                  ),
                  SliverToBoxAdapter(child: _CategoryGrid(categories: data.categories)),
                ],
                const SliverToBoxAdapter(child: SizedBox(height: 12)),
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: AdBannerPlaceholder(),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
                const SliverToBoxAdapter(child: _SectionTitle('All Advertisements')),
                if (data.sections.expand((s) => s.ads).isEmpty)
                  const SliverToBoxAdapter(child: _EmptyAdsNotice())
                else
                  ..._sectionsAsSlivers(context, data),
                const SliverToBoxAdapter(child: SizedBox(height: 110)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Iterable<Widget> _sectionsAsSlivers(BuildContext context, HomeData data) sync* {
    for (final section in data.sections.where((s) => s.ads.isNotEmpty)) {
      yield SliverToBoxAdapter(child: _Section(section: section));
    }
  }
}

// ───────────────────────────────── Location ─────────────────────────────────

/// Unread in-app notifications for the bell badge (0 when signed out / offline).
final _unreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  if (!ref.watch(authControllerProvider).isAuthenticated) return 0;
  try {
    final res = await ref.watch(apiClientProvider).get('/notifications/unread-count');
    return (res.map['unread_count'] as num?)?.toInt() ?? 0;
  } catch (_) {
    return 0;
  }
});

class _LocationCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final label = ref.watch(appPrefsProvider).locationLabel;
    final unread = ref.watch(_unreadCountProvider).value ?? 0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: InkWell(
        onTap: () => context.push('/nearby'),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: _cardDecoration(),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.seed.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.location_on_outlined,
                    color: AppTheme.seed, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label.isNotEmpty ? label : 'Add Location',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textDark,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      label.isNotEmpty ? 'Tap to see ads near you' : 'Tap to set your delivery location',
                      style: const TextStyle(
                        color: Color(0xFF8A8A9C),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Notifications',
                onPressed: () async {
                  await context.push('/notifications');
                  ref.invalidate(_unreadCountProvider);
                },
                icon: Badge(
                  isLabelVisible: unread > 0,
                  label: Text(unread > 99 ? '99+' : '$unread'),
                  child: const Icon(Icons.notifications_none_rounded, color: AppTheme.textDark, size: 24),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────────── Search ──────────────────────────────────

class _SearchBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: InkWell(
        onTap: () => context.push('/search'),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 54,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: _cardDecoration(),
          child: const Row(
            children: [
              Icon(Icons.search, color: AppTheme.seed, size: 22),
              SizedBox(width: 12),
              Text(
                'Search any advertisement…',
                style: TextStyle(
                  color: Color(0xFFA0A0B0),
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────── Category chips ──────────────────────────────

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({required this.categories});
  final List<Category> categories;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final c = categories[i];
          return InkWell(
            onTap: () => context.push('/category/${c.slug}'),
            borderRadius: BorderRadius.circular(22),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Text(
                c.name,
                style: const TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ───────────────────────────── Hero banner ─────────────────────────────────

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.sliders});
  final List<HomeSlider> sliders;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: SizedBox(
        height: 180,
        child: PageView.builder(
          controller: PageController(viewportFraction: 1),
          itemCount: sliders.length,
          itemBuilder: (_, i) {
            final s = sliders[i];
            final url = mediaUrl(s.imageUrl);
            final caption = _SliderCaption(title: s.title);
            return GestureDetector(
              onTap: () {
                if (s.linkType == 'ad' && s.adSlug != null) {
                  context.push('/ad/${s.adSlug}');
                } else if (s.linkType == 'category' && s.categorySlug != null) {
                  context.push('/category/${s.categorySlug}');
                }
              },
              child: Container(
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: const LinearGradient(
                    colors: [AppTheme.seed, Color(0xFF505081)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: url == null
                    ? caption
                    : CachedNetworkImage(
                        imageUrl: url,
                        fit: BoxFit.cover,
                        // Missing/broken banner image → show the slider title, not a blank card.
                        placeholder: (_, __) => caption,
                        errorWidget: (_, __, ___) => caption,
                      ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SliderCaption extends StatelessWidget {
  const _SliderCaption({this.title});
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.all(22),
      child: Text(
        (title == null || title!.isEmpty) ? 'Buy & Sell Anything in One Click' : title!,
        maxLines: 3,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          height: 1.25,
        ),
      ),
    );
  }
}

class _HeroFallback extends StatelessWidget {
  const _HeroFallback();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Container(
        height: 180,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppTheme.seed, Color(0xFF505081)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.all(22),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Buy & Sell',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Anything in One Click',
              style: TextStyle(
                color: AppTheme.accent,
                fontSize: 26,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────── Section title ───────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text, {this.viewAllRoute});
  final String text;
  final String? viewAllRoute;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.2,
              ),
            ),
          ),
          if (viewAllRoute != null)
            InkWell(
              onTap: () => context.push(viewAllRoute!),
              borderRadius: BorderRadius.circular(6),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Text(
                  'View all',
                  style: TextStyle(
                    color: AppTheme.seed,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ───────────────────────── Popular Categories ──────────────────────────────

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({required this.categories});
  final List<Category> categories;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 140,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final c = categories[i];
          final icon = _categoryIcon[c.slug] ?? Icons.local_offer_outlined;
          return InkWell(
            onTap: () => context.push('/category/${c.slug}'),
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              width: 108,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 108,
                    height: 96,
                    decoration: _cardDecoration(),
                    alignment: Alignment.center,
                    child: Icon(icon, color: AppTheme.seed, size: 44),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    c.name,
                    maxLines: 2,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.textDark,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ───────────────────────────── Empty notice ────────────────────────────────

class _EmptyAdsNotice extends StatelessWidget {
  const _EmptyAdsNotice();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 16, 28, 16),
      child: Text(
        'No Ads found at your location. Showing all available Ads.',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: AppTheme.textDark.withValues(alpha: 0.7),
          fontSize: 15,
          height: 1.4,
        ),
      ),
    );
  }
}

// ────────────────────────── Featured section row ───────────────────────────

class _Section extends StatelessWidget {
  const _Section({required this.section});
  final FeaturedSection section;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          child: Text(
            section.title,
            style: const TextStyle(
              color: AppTheme.textDark,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        SizedBox(
          height: 250,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: section.ads.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => AdCard(ad: section.ads[i], width: 170),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────── Shared decoration ─────────────────────────────

BoxDecoration _cardDecoration() {
  return BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(14),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.04),
        blurRadius: 12,
        offset: const Offset(0, 3),
      ),
    ],
  );
}
