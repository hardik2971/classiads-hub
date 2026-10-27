import '../../features/auth/data/user.dart';
import 'category.dart';

class AdImage {
  AdImage({required this.id, this.url, this.isPrimary = false});
  final int id;
  final String? url;
  final bool isPrimary;

  factory AdImage.fromJson(Map<String, dynamic> j) => AdImage(
        id: (j['id'] as num).toInt(),
        url: j['url'] as String?,
        isPrimary: j['is_primary'] == true,
      );
}

class AdFieldValue {
  AdFieldValue({required this.name, required this.value});
  final String name;
  final String value;

  factory AdFieldValue.fromJson(Map<String, dynamic> j) => AdFieldValue(
        name: j['name'] as String? ?? '',
        value: j['value']?.toString() ?? '',
      );
}

class Ad {
  Ad({
    required this.id,
    required this.title,
    required this.slug,
    this.description = '',
    this.priceDisplay,
    this.priceMinor,
    this.priceType = 'fixed',
    this.condition,
    this.status = 'approved',
    this.isFeatured = false,
    this.isFavorited = false,
    this.viewsCount = 0,
    this.cityName,
    this.countryName,
    this.latitude,
    this.longitude,
    this.distanceKm,
    this.category,
    this.seller,
    this.images = const [],
    this.customFields = const [],
    this.publishedAt,
  });

  final int id;
  final String title;
  final String slug;
  final String description;
  final String? priceDisplay;

  /// Raw price in minor units (cents) as stored by the API; null when unpriced.
  final int? priceMinor;
  final String priceType;
  final String? condition;
  final String status;
  final bool isFeatured;
  final bool isFavorited;
  final int viewsCount;
  final String? cityName;
  final String? countryName;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final Category? category;
  final User? seller;
  final List<AdImage> images;
  final List<AdFieldValue> customFields;
  final String? publishedAt;

  String? get primaryImage =>
      (images.where((i) => i.isPrimary).map((i) => i.url).firstWhere((u) => u != null, orElse: () => null)) ??
      (images.isNotEmpty ? images.first.url : null);

  factory Ad.fromJson(Map<String, dynamic> j) {
    final loc = j['location'] as Map<String, dynamic>?;
    return Ad(
      id: (j['id'] as num).toInt(),
      title: j['title'] as String? ?? '',
      slug: j['slug'] as String? ?? '',
      description: j['description'] as String? ?? '',
      priceDisplay: j['price_display'] as String?,
      priceMinor: (j['price'] as num?)?.toInt(),
      priceType: j['price_type'] as String? ?? 'fixed',
      condition: j['condition'] as String?,
      status: j['status'] as String? ?? 'approved',
      isFeatured: j['is_featured'] == true,
      isFavorited: j['is_favorited'] == true,
      viewsCount: (j['views_count'] as num?)?.toInt() ?? 0,
      cityName: loc?['city'] as String?,
      countryName: loc?['country'] as String?,
      latitude: (loc?['latitude'] as num?)?.toDouble(),
      longitude: (loc?['longitude'] as num?)?.toDouble(),
      distanceKm: (j['distance_km'] as num?)?.toDouble(),
      category: j['category'] is Map ? Category.fromJson(j['category'] as Map<String, dynamic>) : null,
      seller: j['seller'] is Map ? User.fromJson(j['seller'] as Map<String, dynamic>) : null,
      images: (j['images'] as List?)?.map((e) => AdImage.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      customFields:
          (j['custom_fields'] as List?)?.map((e) => AdFieldValue.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      publishedAt: j['published_at'] as String?,
    );
  }
}
