import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/format.dart';
import '../../core/network/api_exception.dart';
import '../auth/auth_controller.dart';
import '../auth/data/auth_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'My Profile',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w800,
            fontSize: 22,
            letterSpacing: -0.3,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.textDark),
            tooltip: 'Sign out',
            onPressed: () => _confirmLogout(context, ref),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 110),
        children: [
          _UserCard(name: user?.name, email: user?.email ?? user?.phone, avatarUrl: mediaUrl(user?.avatarPath)),
          const SizedBox(height: 14),
          if (user?.isVerified != true) const _VerificationBanner(),
          if (user?.isVerified != true) const SizedBox(height: 14),

          _MenuItem(
            icon: Icons.star_border_rounded,
            label: 'My Reviews',
            onTap: () => context.push('/reviews'),
          ),
          _MenuItem(
            icon: Icons.assignment_outlined,
            label: 'My Job Applications',
            onTap: () => context.push('/applications'),
          ),
          _MenuItem(
            icon: Icons.translate_outlined,
            label: 'Language',
            onTap: () => context.push('/language'),
          ),
          _MenuItem(
            icon: Icons.favorite_border_rounded,
            label: 'Favorites',
            onTap: () => context.push('/favorites'),
          ),
          _MenuItem(
            icon: Icons.notifications_none_rounded,
            label: 'Notifications',
            onTap: () => context.push('/notifications'),
          ),
          _MenuItem(
            icon: Icons.people_outline_rounded,
            label: 'Followers & Following',
            onTap: () => context.push('/connections'),
          ),
          _MenuItem(
            icon: Icons.saved_search_rounded,
            label: 'Saved Searches',
            onTap: () => context.push('/saved-searches'),
          ),
          _MenuItem(
            icon: Icons.work_outline_rounded,
            label: 'Jobs',
            onTap: () => context.push('/jobs'),
          ),
          _MenuItem(
            icon: Icons.article_outlined,
            label: 'Blog',
            onTap: () => context.push('/blog'),
          ),
          _MenuItem(
            icon: Icons.settings_outlined,
            label: 'Settings',
            onTap: () => context.push('/settings'),
          ),
          _MenuItem(
            icon: Icons.help_outline_rounded,
            label: 'FAQs',
            onTap: () => context.push('/page/faq'),
          ),
          _MenuItem(
            icon: Icons.share_outlined,
            label: 'Share this App',
            onTap: () => _shareApp(context),
          ),
          _MenuItem(
            icon: Icons.star_outline_rounded,
            label: 'Rate us',
            onTap: () => _rateUs(context),
          ),
          _MenuItem(
            icon: Icons.mail_outline_rounded,
            label: 'Contact us',
            onTap: () => context.push('/page/contact'),
          ),
          _MenuItem(
            icon: Icons.info_outline_rounded,
            label: 'About us',
            onTap: () => context.push('/page/about'),
          ),
          _MenuItem(
            icon: Icons.description_outlined,
            label: 'Terms & Conditions',
            onTap: () => context.push('/page/terms'),
          ),
          _MenuItem(
            icon: Icons.shield_outlined,
            label: 'Privacy Policy',
            onTap: () => context.push('/page/privacy'),
          ),
          _MenuItem(
            icon: Icons.payments_outlined,
            label: 'Refund Policy',
            onTap: () => context.push('/page/refund'),
          ),
          _MenuItem(
            icon: Icons.delete_outline_rounded,
            label: 'Delete Account',
            destructive: true,
            onTap: () => _confirmDelete(context, ref),
          ),
        ],
      ),
    );
  }

  // ─────────────── Actions ───────────────

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Sign out'),
        content: const Text('You will need to sign in again to access your account.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(minimumSize: const Size(88, 44)), onPressed: () => Navigator.pop(dialogCtx, true), child: const Text('Sign out')),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(authControllerProvider.notifier).logout();
    if (context.mounted) context.go('/login');
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final password = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Delete account?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This permanently anonymises your personal data and revokes all sessions. '
              'You will not be able to recover it later.',
            ),
            const SizedBox(height: 12),
            TextField(
              controller: password,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                helperText: 'Leave empty if you signed in with Google',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red, minimumSize: const Size(88, 44)),
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    try {
      await ref.read(authRepositoryProvider).deleteAccount(password.text);
      // The Firebase user no longer exists server-side; drop the local session.
      await ref.read(authControllerProvider.notifier).logout();
      messenger.showSnackBar(const SnackBar(content: Text('Your account has been deleted.')));
      router.go('/login');
    } on ApiException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Could not delete the account: $e')));
    }
  }

  void _shareApp(BuildContext context) {
    Clipboard.setData(const ClipboardData(text: 'https://classiadshub.web.app'));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('App link copied to clipboard')),
    );
  }

  void _rateUs(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Rate ClassiAds Hub'),
        content: const Text('Loved the app? Leave us a 5★ on the Play Store / App Store.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('Later')),
          FilledButton(style: FilledButton.styleFrom(minimumSize: const Size(88, 44)), onPressed: () => Navigator.pop(dialogCtx), child: const Text('Rate now')),
        ],
      ),
    );
  }
}

// ─────────────────────── User card ───────────────────────

class _UserCard extends StatelessWidget {
  const _UserCard({this.name, this.email, this.avatarUrl});
  final String? name;
  final String? email;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/profile/edit'),
      behavior: HitTestBehavior.opaque,
      child: Container(
      padding: const EdgeInsets.all(14),
      decoration: _cardDecoration(),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            height: 64,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppTheme.seed.withValues(alpha: 0.10),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  clipBehavior: Clip.antiAlias,
                  child: avatarUrl != null
                      ? CachedNetworkImage(
                          imageUrl: avatarUrl!,
                          width: 64,
                          height: 64,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) =>
                              const Icon(Icons.person_outline, color: AppTheme.seed, size: 36),
                        )
                      : const Icon(Icons.person_outline, color: AppTheme.seed, size: 36),
                ),
                Positioned(
                  right: -2,
                  bottom: -2,
                  child: GestureDetector(
                    onTap: () => context.push('/profile/edit'),
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: AppTheme.seed,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.edit, color: Colors.white, size: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  name ?? 'Guest',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  email ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppTheme.textDark.withValues(alpha: 0.6),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
    );
  }
}

// ─────────────────────── Verification banner ───────────────────────

class _VerificationBanner extends StatelessWidget {
  const _VerificationBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.seed, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user, color: AppTheme.seed, size: 24),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Get Verification Badge',
                  style: TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Verify your account to build trust and increase buyer confidence across your listings.',
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.7),
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 44,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.seed,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              onPressed: () => context.push('/verification'),
              child: const Text('Get Verification Badge'),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Menu item ───────────────────────

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.label,
    this.onTap,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final accent = destructive ? const Color(0xFFD64545) : AppTheme.seed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: _cardDecoration(),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Icon(icon, color: accent, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      color: destructive ? const Color(0xFFD64545) : AppTheme.textDark,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppTheme.textDark.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.chevron_right,
                      color: AppTheme.textDark.withValues(alpha: 0.75),
                      size: 20,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

BoxDecoration _cardDecoration() {
  return BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(14),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.04),
        blurRadius: 10,
        offset: const Offset(0, 3),
      ),
    ],
  );
}

