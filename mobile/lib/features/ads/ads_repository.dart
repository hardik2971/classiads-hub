import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/network/paginated.dart';
import '../../core/utils/fallback.dart';
import '../../shared/models/ad.dart';

class AdsRepository {
  AdsRepository(this._api);
  final ApiClient _api;

  Ad _parse(Map<String, dynamic> j) => Ad.fromJson(j);

  Paginated<Ad> _dummyPage() {
    final ads = DummyData.ads();
    return Paginated(items: ads, currentPage: 1, lastPage: 1, total: ads.length);
  }

  Future<Paginated<Ad>> search(Map<String, dynamic> filters) => withFallback(() async {
        final res = await _api.get('/ads', query: filters);
        return Paginated.fromEnvelope(res.list, res.meta, _parse);
      }, _dummyPage);

  Future<Paginated<Ad>> nearby(double lat, double lng, {double radius = 25}) => withFallback(() async {
        final res = await _api.get('/ads/nearby', query: {'latitude': lat, 'longitude': lng, 'radius': radius});
        return Paginated.fromEnvelope(res.list, res.meta, _parse);
      }, _dummyPage);

  Future<Ad> show(String slug) => withFallback(() async {
        final res = await _api.get('/ads/$slug');
        return Ad.fromJson(res.map);
      }, () => DummyData.ads().first);

  /// Owner fetch for editing — no dummy fallback (editing fake data would be destructive).
  Future<Ad> fetchForEdit(int id) async {
    final res = await _api.get('/ads/$id');
    return Ad.fromJson(res.map);
  }

  Future<List<Ad>> related(String slug) => withFallback(() async {
        final res = await _api.get('/ads/$slug/related');
        return res.list.map((e) => _parse(e as Map<String, dynamic>)).toList();
      }, () => DummyData.ads().skip(1).take(4).toList());

  Future<Paginated<Ad>> myAds() => withFallback(() async {
        final res = await _api.get('/my/ads');
        return Paginated.fromEnvelope(res.list, res.meta, _parse);
      }, _dummyPage);

  Future<Paginated<Ad>> favorites() => withFallback(() async {
        final res = await _api.get('/favorites');
        return Paginated.fromEnvelope(res.list, res.meta, _parse);
      }, () => Paginated(items: DummyData.ads().take(3).toList(), currentPage: 1, lastPage: 1, total: 3));

  Future<bool> toggleFavorite(int adId) async {
    final res = await _api.post('/ads/$adId/favorite');
    return res.map['favorited'] == true;
  }

  Future<Ad> create(Map<String, dynamic> body) async {
    final res = await _api.post('/ads', body: body);
    return Ad.fromJson(res.map);
  }

  Future<void> uploadImages(int adId, List<MultipartFile> files) async {
    final form = FormData();
    for (final f in files) {
      form.files.add(MapEntry('images[]', f));
    }
    await _api.upload('/ads/$adId/images', form);
  }

  Future<void> markSold(int adId) => _api.post('/ads/$adId/sold');
  Future<void> renew(int adId) => _api.post('/ads/$adId/renew');
  Future<void> delete(int adId) => _api.delete('/ads/$adId');

  /// Start (or fetch) a conversation about an ad; returns the conversation id.
  Future<int> startConversation(int adId, {String? message}) async {
    final res = await _api.post('/conversations', body: {'ad_id': adId, if (message != null) 'message': message});
    return (res.map['id'] as num).toInt();
  }

  Future<void> makeOffer(int adId, num amount, {String? message}) =>
      _api.post('/offers', body: {'ad_id': adId, 'amount': amount, if (message != null) 'message': message});

  Future<void> report(String type, int id, String reason, {String? details}) =>
      _api.post('/reports', body: {
        'type': type,
        'id': id,
        'reason': reason,
        if (details != null && details.trim().isNotEmpty) 'details': details.trim(),
      });
}

final adsRepositoryProvider = Provider<AdsRepository>(
  (ref) => AdsRepository(ref.watch(apiClientProvider)),
);
