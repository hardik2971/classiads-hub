import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/category.dart';
import '../../../shared/widgets/state_views.dart';
import '../home_repository.dart';

/// Lightweight icon mapping per category slug — shared with home tiles.
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

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final home = ref.watch(homeProvider);
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
      body: home.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(homeProvider),
        ),
        data: (data) {
          if (data.categories.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text(
                  'No categories yet.',
                  style: TextStyle(color: AppTheme.textDark, fontSize: 15),
                ),
              ),
            );
          }
          return _CategoryGridView(categories: data.categories);
        },
      ),
    );
  }
}

class _CategoryGridView extends StatelessWidget {
  const _CategoryGridView({required this.categories});
  final List<Category> categories;

  // A subtle, deterministic two-tone pattern that gives the grid visual
  // rhythm without breaking the navy/amber palette. Tints rows in a 3-2
  // stripe that mirrors the reference's mix of plain/light cards.
  bool _tinted(int i) {
    final pos = i % 5;
    return pos == 1 || pos == 2 || pos == 3;
  }

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 0.82,
      ),
      itemCount: categories.length,
      itemBuilder: (_, i) {
        final c = categories[i];
        final icon = _categoryIcon[c.slug] ?? Icons.local_offer_outlined;
        return _CategoryTile(category: c, icon: icon, tinted: _tinted(i));
      },
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.category,
    required this.icon,
    required this.tinted,
  });

  final Category category;
  final IconData icon;
  final bool tinted;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/category/${category.slug}'),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          color: tinted
              ? AppTheme.seed.withValues(alpha: 0.07)
              : Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Center(
                child: Icon(icon, size: 56, color: AppTheme.seed),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              category.name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
