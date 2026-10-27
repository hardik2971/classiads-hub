import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/auth_controller.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/location_prompt_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/ads/screens/ad_detail_screen.dart';
import '../../features/ads/screens/category_screen.dart';
import '../../features/ads/screens/edit_ad_screen.dart';
import '../../features/ads/screens/favorites_screen.dart';
import '../../features/ads/screens/gallery_screen.dart';
import '../../features/ads/screens/my_ads_screen.dart';
import '../../features/ads/screens/nearby_screen.dart';
import '../../features/ads/screens/post_ad_screen.dart';
import '../../features/ads/screens/saved_searches_screen.dart';
import '../../features/ads/screens/search_screen.dart';
import '../../features/ads/screens/who_bought_screen.dart';
import '../../features/blog/blog_screens.dart';
import '../../features/chat/screens/chat_conversation_screen.dart';
import '../../features/chat/screens/chat_list_screen.dart';
import '../../features/content/page_screen.dart';
import '../../features/home/screens/categories_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/profile/screens/job_applications_screen.dart';
import '../../features/profile/screens/language_screen.dart';
import '../../features/profile/screens/reviews_screen.dart';
import '../../features/jobs/jobs_screens.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/reviews/write_review_screen.dart';
import '../../features/seller/followers_screen.dart';
import '../../features/seller/seller_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/verification/verification_screen.dart';
import '../storage/app_prefs.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

const _protected = [
  '/post-ad', '/myads', '/chat', '/profile', '/favorites', '/notifications',
  '/settings', '/verification',
  '/saved-searches', '/connections', '/ad-edit',
  '/reviews', '/applications',
];
// Routes an already-authenticated user should be bounced away from.
const _authScreens = {'/login', '/register', '/forgot-password'};

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final prefs = ref.read(appPrefsProvider);
      final loc = state.matchedLocation;

      if (auth.status == AuthStatus.unknown) {
        return loc == '/splash' ? null : '/splash';
      }
      if (!prefs.onboardingSeen) {
        return loc == '/onboarding' ? null : '/onboarding';
      }
      final authed = auth.status == AuthStatus.authenticated;
      if (loc == '/splash') return '/home';
      if (authed && _authScreens.contains(loc)) {
        if (!prefs.locationPrompted) return '/location';
        // Return to the protected page that sent the user to log in.
        final next = state.uri.queryParameters['next'];
        return (next != null && next.startsWith('/')) ? next : '/home';
      }
      if (authed && !prefs.locationPrompted && loc == '/home') {
        return '/location';
      }
      if (!authed && _protected.any((p) => loc.startsWith(p))) {
        return '/login?next=${Uri.encodeComponent(loc)}';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/verify-otp', builder: (_, s) => OtpScreen(
            identifier: s.uri.queryParameters['identifier'] ?? '',
            purpose: s.uri.queryParameters['purpose'] ?? 'register',
            debugCode: s.uri.queryParameters['debug'],
          )),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/location', builder: (_, __) => const LocationPromptScreen()),

      // Full-screen routes (above the shell)
      GoRoute(path: '/ad/:slug', parentNavigatorKey: _rootKey, builder: (_, s) => AdDetailScreen(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/categories', parentNavigatorKey: _rootKey, builder: (_, __) => const CategoriesScreen()),
      GoRoute(path: '/reviews', parentNavigatorKey: _rootKey, builder: (_, __) => const ReviewsScreen()),
      GoRoute(path: '/applications', parentNavigatorKey: _rootKey, builder: (_, __) => const JobApplicationsScreen()),
      GoRoute(path: '/language', parentNavigatorKey: _rootKey, builder: (_, __) => const LanguageScreen()),
      GoRoute(path: '/category/:slug', parentNavigatorKey: _rootKey, builder: (_, s) => CategoryScreen(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/search', parentNavigatorKey: _rootKey, builder: (_, s) => SearchScreen(
            query: s.uri.queryParameters['q'],
            categorySlug: s.uri.queryParameters['category_slug'],
          )),
      GoRoute(path: '/seller/:id', parentNavigatorKey: _rootKey, builder: (_, s) => SellerScreen(id: int.parse(s.pathParameters['id']!))),
      GoRoute(path: '/post-ad', parentNavigatorKey: _rootKey, builder: (_, __) => const PostAdScreen()),
      GoRoute(path: '/favorites', parentNavigatorKey: _rootKey, builder: (_, __) => const FavoritesScreen()),
      GoRoute(path: '/notifications', parentNavigatorKey: _rootKey, builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/settings', parentNavigatorKey: _rootKey, builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/profile/edit', parentNavigatorKey: _rootKey, builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/conversations/:id', parentNavigatorKey: _rootKey, builder: (_, s) => ChatConversationScreen(id: int.parse(s.pathParameters['id']!))),
      GoRoute(path: '/blog', parentNavigatorKey: _rootKey, builder: (_, __) => const BlogListScreen()),
      GoRoute(path: '/blog/:slug', parentNavigatorKey: _rootKey, builder: (_, s) => BlogDetailScreen(slug: s.pathParameters['slug']!)),

      // Phase: complete §4.1 inventory
      GoRoute(path: '/nearby', parentNavigatorKey: _rootKey, builder: (_, __) => const NearbyScreen()),
      GoRoute(path: '/gallery', parentNavigatorKey: _rootKey, builder: (_, s) {
            final extra = (s.extra as Map?) ?? const {};
            return GalleryScreen(
              images: (extra['images'] as List?)?.cast<String>() ?? const [],
              initial: (extra['index'] as int?) ?? 0,
            );
          }),
      GoRoute(path: '/ad-edit/:id', parentNavigatorKey: _rootKey, builder: (_, s) => EditAdScreen(id: int.parse(s.pathParameters['id']!))),
      GoRoute(path: '/ad/:id/who-bought', parentNavigatorKey: _rootKey, builder: (_, s) => WhoBoughtScreen(adId: int.parse(s.pathParameters['id']!))),
      GoRoute(path: '/seller/:id/review', parentNavigatorKey: _rootKey, builder: (_, s) => WriteReviewScreen(sellerId: int.parse(s.pathParameters['id']!))),
      GoRoute(path: '/connections', parentNavigatorKey: _rootKey, builder: (_, __) => const FollowersScreen()),
      GoRoute(path: '/verification', parentNavigatorKey: _rootKey, builder: (_, __) => const VerificationScreen()),
      GoRoute(path: '/saved-searches', parentNavigatorKey: _rootKey, builder: (_, __) => const SavedSearchesScreen()),
      GoRoute(path: '/jobs', parentNavigatorKey: _rootKey, builder: (_, __) => const JobsScreen()),
      GoRoute(path: '/jobs/:slug', parentNavigatorKey: _rootKey, builder: (_, s) => JobDetailScreen(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/page/:key', parentNavigatorKey: _rootKey, builder: (_, s) => CmsPageScreen(pageKey: s.pathParameters['key']!)),

      // Bottom-nav shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(navigatorKey: _shellKey, routes: [GoRoute(path: '/home', builder: (_, __) => const HomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/chat', builder: (_, __) => const ChatListScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/myads', builder: (_, __) => const MyAdsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen())]),
        ],
      ),
    ],
  );
});
