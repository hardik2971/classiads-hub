import '../../features/auth/data/user.dart';
import '../../features/chat/chat_repository.dart';
import '../../features/home/home_repository.dart';
import '../../shared/models/ad.dart';
import '../../shared/models/category.dart';

/// Sample data shown when the API can't be reached, so every screen renders.
class DummyData {
  static const _img = 'https://picsum.photos/seed/';

  static Map<String, dynamic> _adJson(int id, String title, String price, String city, String seed,
          {bool featured = false}) =>
      {
        'id': id,
        'title': title,
        'slug': 'sample-$id',
        'description': 'This is sample listing content shown because live data could not be loaded. '
            '$title in great condition, available now.',
        'price_display': price,
        'price_type': 'negotiable',
        'condition': 'used',
        'status': 'approved',
        'is_featured': featured,
        'views_count': 100 + id * 7,
        'location': {'city': city, 'country': 'India'},
        'category': {'id': 1, 'name': 'Electronics', 'slug': 'electronics'},
        'seller': {'id': 2, 'name': 'Demo Seller', 'is_verified': true},
        'images': [
          {'id': id, 'url': '$_img$seed/600/450', 'is_primary': true},
          {'id': id * 10, 'url': '$_img${seed}b/600/450', 'is_primary': false},
        ],
        'custom_fields': [
          {'name': 'Brand', 'value': 'Generic'},
          {'name': 'Warranty', 'value': '6 months'},
        ],
        'published_at': DateTime.now().subtract(Duration(days: id)).toIso8601String(),
      };

  static List<Ad> ads() => [
        _adJson(1, 'iPhone 14 Pro Max 256GB', '\$899.00', 'Mumbai', 'phone', featured: true),
        _adJson(2, 'Toyota Corolla 2020', '\$14,500.00', 'Surat', 'car', featured: true),
        _adJson(3, 'MacBook Air M2', '\$1,050.00', 'Bhuj', 'laptop'),
        _adJson(4, '3BHK Apartment for Rent', '\$750.00', 'Dubai', 'house'),
        _adJson(5, 'Canon EOS R6 Camera', '\$1,800.00', 'Pune', 'camera'),
        _adJson(6, 'Gaming Chair', '\$120.00', 'Mumbai', 'chair'),
      ].map((j) => Ad.fromJson(j)).toList();

  static List<Category> categories() => [
        {'id': 1, 'name': 'Real Estate', 'slug': 'real-estate', 'children': []},
        {'id': 2, 'name': 'Cars & Vehicles', 'slug': 'cars-vehicles', 'children': []},
        {'id': 3, 'name': 'Mobile Phones & Tablets', 'slug': 'mobile-phones-tablets', 'children': []},
        {'id': 4, 'name': 'Electronics', 'slug': 'electronics', 'children': []},
        {'id': 5, 'name': 'Home Appliances', 'slug': 'home-appliances', 'children': []},
        {'id': 6, 'name': 'Furniture', 'slug': 'furniture-home-garden', 'children': []},
        {'id': 7, 'name': 'Jobs', 'slug': 'jobs', 'children': []},
        {'id': 8, 'name': 'Pets', 'slug': 'pets', 'children': []},
      ].map((j) => Category.fromJson(j)).toList();

  static HomeData home() => HomeData(
        sliders: [
          HomeSlider(imageUrl: '${_img}banner1/800/300', title: 'Buy & Sell Anything', linkType: 'none'),
          HomeSlider(imageUrl: '${_img}banner2/800/300', title: 'Featured Deals', linkType: 'none'),
        ],
        categories: categories(),
        sections: [
          FeaturedSection(title: 'Featured Listings', ads: ads().take(4).toList()),
          FeaturedSection(title: 'Most Viewed', ads: ads().reversed.take(4).toList()),
        ],
      );

  static List<Conversation> conversations() => [
        Conversation(
          id: 1, role: 'buyer', unreadCount: 2, lastMessage: 'Is this still available?',
          lastMessageAt: DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
          counterpart: User(id: 2, name: 'Demo Seller', isVerified: true),
          ad: ads().first,
        ),
        Conversation(
          id: 2, role: 'seller', unreadCount: 0, lastMessage: 'Deal! I will take it.',
          lastMessageAt: DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
          counterpart: User(id: 3, name: 'John Buyer'),
          ad: ads()[2],
        ),
      ];

  static List<Message> messages() => [
        Message(id: 1, isMine: false, body: 'Hi, is this still available?', createdAt: DateTime.now().subtract(const Duration(minutes: 30)).toIso8601String()),
        Message(id: 2, isMine: true, body: 'Yes it is!', createdAt: DateTime.now().subtract(const Duration(minutes: 25)).toIso8601String()),
        Message(id: 3, isMine: false, type: 'offer', body: '\$800 offered', createdAt: DateTime.now().subtract(const Duration(minutes: 20)).toIso8601String()),
        Message(id: 4, isMine: true, body: 'How about \$850?', createdAt: DateTime.now().subtract(const Duration(minutes: 15)).toIso8601String()),
      ];

  static List<Map<String, dynamic>> notifications() => [
        {'id': '1', 'title': 'New message', 'body': 'Demo Seller sent you a message', 'read': false, 'created_at': DateTime.now().subtract(const Duration(minutes: 10)).toIso8601String()},
        {'id': '2', 'title': 'Offer accepted', 'body': 'Your offer of \$850 was accepted', 'read': false, 'created_at': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String()},
        {'id': '3', 'title': 'Welcome!', 'body': 'Welcome to ClassiAds Hub', 'read': true, 'created_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String()},
      ];

  static List<Map<String, dynamic>> blogPosts() => [
        {'title': 'Secure Transactions Made Simple', 'slug': 'sample-blog-1', 'excerpt': 'How we keep your payments and trades safe.', 'cover_image': '${_img}blog1/800/450', 'body': 'Sample article content shown offline.', 'published_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(), 'author': {'name': 'Admin'}},
        {'title': 'Top Tips for Selling Faster', 'slug': 'sample-blog-2', 'excerpt': 'Great photos and fair prices win.', 'cover_image': '${_img}blog2/800/450', 'body': 'Sample article content shown offline.', 'published_at': DateTime.now().subtract(const Duration(days: 3)).toIso8601String(), 'author': {'name': 'Admin'}},
      ];

  static List<Map<String, dynamic>> jobs() => [
        {'id': 1, 'title': 'Senior Flutter Developer', 'slug': 'sample-job-1', 'company_name': 'ClassiAds Tech', 'city': 'Remote', 'employment_type': 'full_time', 'salary_display': '\$60k – \$90k', 'status': 'open', 'description': 'Build delightful mobile experiences. Sample job shown offline.'},
        {'id': 2, 'title': 'Part-time Designer', 'slug': 'sample-job-2', 'company_name': 'Studio', 'city': 'Mumbai', 'employment_type': 'part_time', 'salary_display': '\$20/hr', 'status': 'open', 'description': 'Design marketing assets. Sample job shown offline.'},
      ];

  static List<Map<String, dynamic>> packages() => [
        {
          'id': 1,
          'name': 'Monthly Pack',
          'tier': 'gem',
          'price_display': '₹199.00',
          'duration_days': 30,
          'ad_limit': 25,
          'is_unlimited': false,
          'description': 'Great for casual sellers',
          'features': ['Ideal for short-term listings', 'Quick visibility', 'Affordable entry'],
          'categories_included': ['Classifieds'],
        },
        {
          'id': 2,
          'name': '3 Month Pack',
          'tier': 'flame',
          'price_display': '₹449.10',
          'original_price_display': '₹499.00',
          'discount_percent': 10,
          'duration_days': 90,
          'ad_limit': 75,
          'is_unlimited': false,
          'description': 'For active sellers',
          'features': ['Extended reach', 'Save more with bundle', 'Best for seasonal sellers'],
          'categories_included': ['Classifieds', 'Pets'],
        },
        {
          'id': 3,
          'name': 'Yearly Pack',
          'tier': 'crown',
          'price_display': '₹1,049.30',
          'original_price_display': '₹1,499.00',
          'discount_percent': 30,
          'duration_days': 365,
          'ad_limit': 300,
          'is_unlimited': false,
          'description': 'Unlimited listings',
          'features': ['Full-year access', 'Maximum savings', 'Premium placement', 'Priority support', 'Highlight badge'],
          'categories_included': ['Automotive & Vehicles', 'Real Estate', 'Classifieds', 'Electronics', 'Pets'],
        },
      ];

  static List<Map<String, dynamic>> transactions() => [
        {'id': 1, 'type': 'subscription', 'gateway': 'sandbox', 'total_display': '\$22.49', 'status': 'completed', 'paid_at': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(), 'invoice': {'number': 'INV-20260525-000001'}},
        {'id': 2, 'type': 'featured_ad', 'gateway': 'sandbox', 'total_display': '\$4.99', 'status': 'completed', 'paid_at': DateTime.now().subtract(const Duration(days: 5)).toIso8601String(), 'invoice': {'number': 'INV-20260520-000002'}},
      ];

  static List<Map<String, dynamic>> reviews() => [
        {'id': 1, 'rating': 5, 'comment': 'Great seller, smooth deal!', 'reviewer': {'id': 3, 'name': 'John Buyer'}, 'created_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String()},
        {'id': 2, 'rating': 4, 'comment': 'Item as described.', 'reviewer': {'id': 4, 'name': 'Sara M'}, 'created_at': DateTime.now().subtract(const Duration(days: 4)).toIso8601String()},
      ];

  static List<User> users() => [
        User(id: 3, name: 'John Buyer'),
        User(id: 4, name: 'Sara M', isVerified: true),
        User(id: 5, name: 'Mike R'),
      ];
}
