import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/location_service.dart';
import '../../../core/storage/app_prefs.dart';
import '../../../core/theme/app_theme.dart';

/// One-shot prompt shown after the first successful login so the user can
/// tell us where they are. Persists `locationPrompted=true` regardless of
/// which choice is made, so it never blocks navigation a second time.
class LocationPromptScreen extends ConsumerStatefulWidget {
  const LocationPromptScreen({super.key});

  @override
  ConsumerState<LocationPromptScreen> createState() => _LocationPromptScreenState();
}

class _LocationPromptScreenState extends ConsumerState<LocationPromptScreen> {
  bool _busy = false;

  Future<void> _finish({String? label}) async {
    final prefs = ref.read(appPrefsProvider);
    if (label != null && label.isNotEmpty) {
      await prefs.setLocationLabel(label);
    }
    await prefs.setLocationPrompted(true);
    if (mounted) context.go('/home');
  }

  Future<void> _findMyLocation() async {
    setState(() => _busy = true);
    final svc = ref.read(locationServiceProvider);
    final pos = await svc.currentPosition();

    if (pos == null) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location permission denied — pick "Other Location" instead.'),
        ),
      );
      return;
    }

    final label = await svc.describe(pos.latitude, pos.longitude);
    if (!mounted) return;
    setState(() => _busy = false);
    await _finish(label: label ?? 'Current location');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: CustomPaint(
                    size: const Size(280, 280),
                    painter: _LocationIllustration(),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "What's your location?",
                style: TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Enjoy a personalized selling and buying\nexperience by telling us your location',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppTheme.textDark.withValues(alpha: 0.62),
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 28),
              _PrimaryButton(
                label: _busy ? 'Locating…' : 'Find My Location',
                onTap: _busy ? null : _findMyLocation,
                busy: _busy,
              ),
              const SizedBox(height: 12),
              _OutlineButton(
                label: 'Other Location',
                onTap: _busy ? null : () => _finish(),
              ),
              const SizedBox(height: 4),
            ],
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────── Buttons ─────────────────────────────

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.onTap,
    this.busy = false,
  });
  final String label;
  final VoidCallback? onTap;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.seed,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppTheme.seed.withValues(alpha: 0.6),
          disabledForegroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: busy
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: Colors.white,
                ),
              )
            : Text(
                label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.2,
                ),
              ),
      ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  const _OutlineButton({required this.label, required this.onTap});
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.seed,
          side: const BorderSide(color: AppTheme.seed, width: 1.4),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────── Illustration ───────────────────────────

/// Stylised person-with-map-pin illustration painted in the brand palette.
/// Designed as a single CustomPainter so we don't need a new asset and so
/// the colours stay locked to AppTheme constants.
class _LocationIllustration extends CustomPainter {
  static const _navy = AppTheme.seed;
  static const _amber = AppTheme.accent;
  static const _secondary = AppTheme.secondary;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Soft window-pane backdrop behind the figure.
    final paneRect = Rect.fromLTWH(w * 0.06, h * 0.04, w * 0.88, h * 0.62);
    final paneFill = Paint()..color = Colors.white.withValues(alpha: 0.55);
    canvas.drawRRect(
      RRect.fromRectAndRadius(paneRect, const Radius.circular(14)),
      paneFill,
    );
    final paneStroke = Paint()
      ..color = _navy.withValues(alpha: 0.10)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    canvas.drawRRect(
      RRect.fromRectAndRadius(paneRect, const Radius.circular(14)),
      paneStroke,
    );
    // Pane crossbars.
    canvas.drawLine(
      Offset(paneRect.left + paneRect.width / 2, paneRect.top),
      Offset(paneRect.left + paneRect.width / 2, paneRect.bottom),
      paneStroke,
    );
    canvas.drawLine(
      Offset(paneRect.left, paneRect.top + paneRect.height / 2),
      Offset(paneRect.right, paneRect.top + paneRect.height / 2),
      paneStroke,
    );

    // Decorative dashed paths swirling around the figure.
    _drawDashedPath(
      canvas,
      Path()
        ..moveTo(w * 0.18, h * 0.18)
        ..cubicTo(w * 0.05, h * 0.28, w * 0.10, h * 0.50, w * 0.28, h * 0.55)
        ..cubicTo(w * 0.45, h * 0.58, w * 0.50, h * 0.40, w * 0.62, h * 0.42),
      _navy.withValues(alpha: 0.45),
    );
    _drawDashedPath(
      canvas,
      Path()
        ..moveTo(w * 0.72, h * 0.20)
        ..cubicTo(w * 0.92, h * 0.18, w * 0.95, h * 0.36, w * 0.80, h * 0.38),
      _navy.withValues(alpha: 0.35),
    );

    // ── Person silhouette ──────────────────────────────────────────
    final figurePaint = Paint()..color = _secondary;
    final headPaint = Paint()..color = _navy;

    // Head
    canvas.drawCircle(Offset(w * 0.36, h * 0.28), 17, headPaint);
    // Hair cap on top of head
    final hairPath = Path()
      ..moveTo(w * 0.30, h * 0.27)
      ..quadraticBezierTo(w * 0.36, h * 0.21, w * 0.42, h * 0.27)
      ..lineTo(w * 0.42, h * 0.29)
      ..quadraticBezierTo(w * 0.36, h * 0.24, w * 0.30, h * 0.29)
      ..close();
    canvas.drawPath(hairPath, headPaint);

    // Body (jacket)
    final body = Path()
      ..moveTo(w * 0.30, h * 0.38)
      ..lineTo(w * 0.42, h * 0.38)
      ..lineTo(w * 0.46, h * 0.62)
      ..lineTo(w * 0.26, h * 0.62)
      ..close();
    canvas.drawPath(body, figurePaint);
    // Arm reaching toward the pin
    final arm = Path()
      ..moveTo(w * 0.42, h * 0.42)
      ..lineTo(w * 0.58, h * 0.40)
      ..lineTo(w * 0.60, h * 0.43)
      ..lineTo(w * 0.43, h * 0.46)
      ..close();
    canvas.drawPath(arm, figurePaint);

    // Trousers
    final trousers = Paint()..color = _navy;
    canvas.drawRect(
      Rect.fromLTRB(w * 0.28, h * 0.62, w * 0.36, h * 0.78),
      trousers,
    );
    canvas.drawRect(
      Rect.fromLTRB(w * 0.36, h * 0.62, w * 0.44, h * 0.78),
      trousers,
    );
    // Shoes
    final shoes = Paint()..color = _amber;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(w * 0.27, h * 0.78, w * 0.37, h * 0.82),
        const Radius.circular(3),
      ),
      shoes,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(w * 0.37, h * 0.78, w * 0.47, h * 0.82),
        const Radius.circular(3),
      ),
      shoes,
    );

    // ── Giant map pin ──────────────────────────────────────────────
    final pinCenter = Offset(w * 0.70, h * 0.50);
    const pinRadius = 56.0;
    final pinBody = Paint()..color = _navy;

    // Drop teardrop shape
    final pin = Path()
      ..moveTo(pinCenter.dx, pinCenter.dy + pinRadius + 28)
      ..quadraticBezierTo(
        pinCenter.dx + pinRadius + 4,
        pinCenter.dy + 8,
        pinCenter.dx + pinRadius * 0.7,
        pinCenter.dy - pinRadius * 0.7,
      )
      ..arcToPoint(
        Offset(pinCenter.dx - pinRadius * 0.7, pinCenter.dy - pinRadius * 0.7),
        radius: const Radius.circular(pinRadius),
        clockwise: false,
      )
      ..quadraticBezierTo(
        pinCenter.dx - pinRadius - 4,
        pinCenter.dy + 8,
        pinCenter.dx,
        pinCenter.dy + pinRadius + 28,
      )
      ..close();
    canvas.drawPath(pin, pinBody);

    // Amber dot in the centre of the pin.
    canvas.drawCircle(
      pinCenter.translate(0, -10),
      22,
      Paint()..color = _amber,
    );
    canvas.drawCircle(
      pinCenter.translate(0, -10),
      9,
      Paint()..color = _navy,
    );

    // Ground shadow under the pin & figure.
    final shadow = Paint()
      ..color = _navy.withValues(alpha: 0.10)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(w * 0.50, h * 0.92),
        width: w * 0.78,
        height: 14,
      ),
      shadow,
    );
  }

  void _drawDashedPath(Canvas canvas, Path source, Color color) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;
    const dash = 4.0;
    const gap = 5.0;
    for (final m in source.computeMetrics()) {
      var d = 0.0;
      while (d < m.length) {
        final next = (d + dash).clamp(0.0, m.length);
        canvas.drawPath(m.extractPath(d, next), paint);
        d = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _LocationIllustration oldDelegate) => false;
}
