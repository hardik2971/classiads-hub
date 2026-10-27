import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/paginated.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/models/category.dart';
import '../../../shared/widgets/ad_card.dart';
import '../../../shared/widgets/state_views.dart';
import '../../catalog/catalog_repository.dart';
import '../ads_repository.dart';

/// Slug → outlined Material icon. Mirrors the home/categories grid so the
/// same category renders consistently across the app.
const _categoryIcon = <String, IconData>{
  'real-estate': Icons.house_outlined,
  'residential-properties': Icons.house_outlined,
  'cars-vehicles': Icons.directions_car_outlined,
  'automotive-vehicles': Icons.directions_car_outlined,
  'cars': Icons.directions_car_outlined,
  'bikes': Icons.pedal_bike_outlined,
  'motorcycles': Icons.two_wheeler_outlined,
  'heavy-vehicles': Icons.local_shipping_outlined,
  'accessories-parts': Icons.settings_outlined,
  'mobile-phones-tablets': Icons.smartphone_outlined,
  'smartphones': Icons.smartphone_outlined,
  'tablets': Icons.tablet_outlined,
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
  'others': Icons.apps_outlined,
};

class CategoryScreen extends ConsumerStatefulWidget {
  const CategoryScreen({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends ConsumerState<CategoryScreen> {
  Future<Category>? _category;
  Future<Paginated<Ad>>? _ads;

  @override
  void initState() {
    super.initState();
    _category = ref.read(catalogRepositoryProvider).bySlug(widget.slug);
    _ads = ref.read(adsRepositoryProvider).search({'category_slug': widget.slug, 'per_page': 30});
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
        title: const Text(
          'Categories',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w700,
            fontSize: 19,
          ),
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<Category>(
        future: _category,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingView();
          }
          final cat = snap.data;
          if (cat == null) {
            return const EmptyView(message: 'Category not found.');
          }
          if (cat.children.isNotEmpty) {
            return _SubCategoryList(parent: cat);
          }
          // Leaf category — render ads grid below the breadcrumb.
          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _Breadcrumb(label: cat.name)),
              FutureBuilder<Paginated<Ad>>(
                future: _ads,
                builder: (context, adsSnap) {
                  if (adsSnap.connectionState == ConnectionState.waiting) {
                    return const SliverFillRemaining(child: LoadingView());
                  }
                  final ads = adsSnap.data?.items ?? [];
                  if (ads.isEmpty) {
                    return const SliverFillRemaining(
                      child: EmptyView(message: 'No listings in this category yet'),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.all(12),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 240,
                        childAspectRatio: 0.72,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => AdCard(ad: ads[i]),
                        childCount: ads.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

// ───────────────────────────── Sub-cat list ────────────────────────────────

class _SubCategoryList extends StatelessWidget {
  const _SubCategoryList({required this.parent});
  final Category parent;

  IconData _iconFor(String slug) => _categoryIcon[slug] ?? Icons.local_offer_outlined;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
      children: [
        _Breadcrumb(label: parent.name),
        const SizedBox(height: 14),
        // "All in {parent}" → routes to a search filtered by this slug.
        _SubCategoryRow(
          icon: _iconFor(parent.slug),
          tone: _Tone.navy,
          label: 'All in ${parent.name}',
          onTap: () => context.push('/search?category_slug=${parent.slug}'),
        ),
        const SizedBox(height: 10),
        for (var i = 0; i < parent.children.length; i++) ...[
          _SubCategoryRow(
            icon: _iconFor(parent.children[i].slug),
            tone: _Tone.values[(i + 1) % _Tone.values.length],
            label: parent.children[i].name,
            onTap: () => context.push('/category/${parent.children[i].slug}'),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

// ───────────────────────────── Breadcrumb ──────────────────────────────────

class _Breadcrumb extends StatelessWidget {
  const _Breadcrumb({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => context.go('/home'),
          child: const Icon(Icons.home_rounded, color: AppTheme.textDark, size: 24),
        ),
        const SizedBox(width: 8),
        const Icon(Icons.chevron_right, color: AppTheme.seed, size: 22),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.seed,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

// ───────────────────────────── Sub-cat row ─────────────────────────────────

/// Soft tinted circle palette — rotates for visual variety while staying
/// within the brand (navy + amber + neutral muted secondary).
enum _Tone { navy, amber, secondary, peach, mint }

class _SubCategoryRow extends StatelessWidget {
  const _SubCategoryRow({
    required this.icon,
    required this.tone,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final _Tone tone;
  final String label;
  final VoidCallback onTap;

  ({Color tint, Color icon}) get _colors {
    switch (tone) {
      case _Tone.navy:
        return (tint: AppTheme.seed.withValues(alpha: 0.10), icon: AppTheme.seed);
      case _Tone.amber:
        return (tint: AppTheme.accent.withValues(alpha: 0.18), icon: const Color(0xFFB57F00));
      case _Tone.secondary:
        return (tint: AppTheme.secondary.withValues(alpha: 0.15), icon: AppTheme.secondary);
      case _Tone.peach:
        return (tint: const Color(0xFFFFE4D6), icon: const Color(0xFFE07A4A));
      case _Tone.mint:
        return (tint: const Color(0xFFE0F4ED), icon: const Color(0xFF1F8A6B));
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = _colors;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: colors.tint,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: colors.icon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.textDark.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.chevron_right,
                  color: AppTheme.textDark,
                  size: 22,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
