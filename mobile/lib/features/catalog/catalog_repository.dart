import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../../shared/models/category.dart';

class CatalogRepository {
  CatalogRepository(this._api);
  final ApiClient _api;

  Future<List<Category>> tree() => withFallback(() async {
        final res = await _api.get('/categories/tree');
        return res.list.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
      }, DummyData.categories);

  Future<List<Category>> roots() => withFallback(() async {
        final res = await _api.get('/categories', query: {'roots_only': true});
        return res.list.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
      }, DummyData.categories);

  Future<Category> bySlug(String slug) => withFallback(() async {
        final res = await _api.get('/categories/$slug');
        return Category.fromJson(res.map);
      }, () => DummyData.categories().firstWhere((c) => c.slug == slug, orElse: () => DummyData.categories().first));

  Future<List<CustomField>> customFields(int categoryId) async {
    final res = await _api.get('/categories/$categoryId/custom-fields');
    return res.list.map((e) => CustomField.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.watch(apiClientProvider)),
);

/// Root categories (cached for the session).
final categoriesProvider = FutureProvider<List<Category>>(
  (ref) => ref.watch(catalogRepositoryProvider).tree(),
);
