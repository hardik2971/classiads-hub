import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../../shared/models/ad.dart';
import '../../shared/models/category.dart';

class HomeSlider {
  HomeSlider({this.imageUrl, this.title, this.linkType = 'none', this.adSlug, this.categorySlug});
  final String? imageUrl;
  final String? title;
  final String linkType;
  final String? adSlug;
  final String? categorySlug;

  factory HomeSlider.fromJson(Map<String, dynamic> j) => HomeSlider(
        imageUrl: j['image_url'] as String?,
        title: j['title'] as String?,
        linkType: j['link_type'] as String? ?? 'none',
        adSlug: j['ad_slug'] as String?,
        categorySlug: j['category_slug'] as String?,
      );
}

class FeaturedSection {
  FeaturedSection({required this.title, required this.ads});
  final String title;
  final List<Ad> ads;

  factory FeaturedSection.fromJson(Map<String, dynamic> j) => FeaturedSection(
        title: j['title'] as String? ?? '',
        ads: (j['ads'] as List?)?.map((e) => Ad.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      );
}

class HomeData {
  HomeData({required this.sliders, required this.categories, required this.sections});
  final List<HomeSlider> sliders;
  final List<Category> categories;
  final List<FeaturedSection> sections;
}

class HomeRepository {
  HomeRepository(this._api);
  final ApiClient _api;

  Future<HomeData> load() => withFallback(() async {
        final res = await _api.get('/home');
        final m = res.map;
        return HomeData(
          sliders: (m['sliders'] as List?)?.map((e) => HomeSlider.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
          categories: (m['categories'] as List?)?.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
          sections: (m['featured_sections'] as List?)?.map((e) => FeaturedSection.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
        );
      }, DummyData.home);
}

final homeRepositoryProvider = Provider<HomeRepository>((ref) => HomeRepository(ref.watch(apiClientProvider)));

final homeProvider = FutureProvider<HomeData>((ref) => ref.watch(homeRepositoryProvider).load());
