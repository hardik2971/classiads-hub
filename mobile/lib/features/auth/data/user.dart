/// Authenticated user (mirrors backend UserResource).
class User {
  User({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.avatarPath,
    this.status = 'active',
    this.isVerified = false,
    this.roles = const [],
    this.preferredLanguage,
    this.preferredCurrency,
    this.address,
    this.ratingAvg = 0,
    this.ratingCount = 0,
  });

  final int id;
  final String name;
  final String? email;
  final String? phone;
  final String? avatarPath;
  final String status;
  final bool isVerified;
  final List<String> roles;
  final String? preferredLanguage;
  final String? preferredCurrency;

  /// Profile address (returned by /auth/me and PUT /auth/profile).
  final String? address;

  /// Seller rating (from `seller_profile`); 0 when the user has no reviews.
  final double ratingAvg;
  final int ratingCount;

  bool get isSeller => roles.contains('seller');
  bool get isAdmin => roles.contains('admin') || roles.contains('super-admin');

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: (j['id'] as num).toInt(),
        name: j['name'] as String? ?? '',
        email: j['email'] as String?,
        phone: j['phone'] as String?,
        avatarPath: j['avatar_path'] as String?,
        status: j['status'] as String? ?? 'active',
        isVerified: j['is_verified'] == true,
        roles: (j['roles'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        preferredLanguage: j['preferred_language'] as String?,
        preferredCurrency: j['preferred_currency'] as String?,
        address: j['address'] as String?,
        ratingAvg: ((j['seller_profile'] as Map?)?['rating_avg'] as num?)?.toDouble() ?? 0,
        ratingCount: ((j['seller_profile'] as Map?)?['rating_count'] as num?)?.toInt() ?? 0,
      );
}
