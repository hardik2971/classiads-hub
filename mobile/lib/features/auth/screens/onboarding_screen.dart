import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/storage/app_prefs.dart';
import '../../../core/theme/app_theme.dart';

class _Slide {
  const _Slide(this.asset, this.title, this.subtitle);
  final String asset;
  final String title;
  final String subtitle;
}

const _slides = <_Slide>[
  _Slide(
    'assets/slide1.png',
    'Snap & List',
    'Take a clean photo of what you want to sell — your ad goes live in under a minute.',
  ),
  _Slide(
    'assets/slide2.png',
    'Discover Nearby',
    'Browse thousands of fresh local listings and filter by distance, price, and category.',
  ),
  _Slide(
    'assets/slide3.png',
    'Chat & Close Deals',
    'Negotiate with buyers, accept offers, and complete trades — safely, all in one place.',
  ),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;
  String _lang = 'En';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(appPrefsProvider).setOnboardingSeen();
    if (mounted) context.go('/login');
  }

  void _next() {
    if (_page == _slides.length - 1) {
      _finish();
    } else {
      _controller.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(
              lang: _lang,
              onLangChanged: (v) => setState(() => _lang = v),
              onSkip: _finish,
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (_, i) => _SlidePage(slide: _slides[i]),
              ),
            ),
            _BottomBar(
              page: _page,
              total: _slides.length,
              onNext: _next,
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────── Top bar ─────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({required this.lang, required this.onLangChanged, required this.onSkip});
  final String lang;
  final ValueChanged<String> onLangChanged;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          // Language pill (visual selector — full i18n switching is wired separately)
          PopupMenuButton<String>(
            tooltip: 'Language',
            onSelected: onLangChanged,
            position: PopupMenuPosition.under,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'En', child: Text('English')),
              PopupMenuItem(value: 'Ar', child: Text('العربية')),
              PopupMenuItem(value: 'Hi', child: Text('हिन्दी')),
              PopupMenuItem(value: 'Es', child: Text('Español')),
            ],
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  lang,
                  style: const TextStyle(
                    color: AppTheme.textDark,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.keyboard_arrow_down, color: AppTheme.seed, size: 20),
              ],
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: onSkip,
            style: TextButton.styleFrom(
              backgroundColor: AppTheme.accent,
              foregroundColor: AppTheme.textDark,
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            child: const Text('Skip'),
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── Slide page ─────────────────────────────

class _SlidePage extends StatelessWidget {
  const _SlidePage({required this.slide});
  final _Slide slide;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const Spacer(flex: 1),
          // Illustration
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Image.asset(
              slide.asset,
              fit: BoxFit.contain,
              height: 280,
            ),
          ),
          const Spacer(flex: 1),
          // Text card
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 4),
            padding: const EdgeInsets.fromLTRB(28, 28, 28, 28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 24,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  slide.title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppTheme.seed,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  slide.subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.textDark.withValues(alpha: 0.55),
                    fontSize: 15,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── Bottom bar ─────────────────────────────

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.page, required this.total, required this.onNext});
  final int page;
  final int total;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final isLast = page == total - 1;
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 12, 32, 24),
      child: Row(
        children: [
          // Animated page dashes
          Row(
            children: List.generate(total, (i) {
              final active = i == page;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOut,
                margin: const EdgeInsets.only(right: 8),
                height: 6,
                width: active ? 28 : 14,
                decoration: BoxDecoration(
                  color: active ? AppTheme.seed : AppTheme.seed.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
          const Spacer(),
          // Circle next / get-started button
          Material(
            color: AppTheme.seed,
            shape: const CircleBorder(),
            elevation: 3,
            shadowColor: AppTheme.seed.withValues(alpha: 0.35),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onNext,
              child: SizedBox(
                width: 56,
                height: 56,
                child: Icon(
                  isLast ? Icons.check : Icons.arrow_forward,
                  color: Colors.white,
                  size: 26,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
