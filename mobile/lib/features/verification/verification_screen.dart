import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/state_views.dart';
import '../auth/auth_controller.dart';

class _Country {
  const _Country(this.flag, this.dial, this.name);
  final String flag;
  final String dial;
  final String name;
}

const _countries = <_Country>[
  _Country('🇮🇳', '+91', 'India'),
  _Country('🇺🇸', '+1', 'United States'),
  _Country('🇬🇧', '+44', 'United Kingdom'),
  _Country('🇦🇪', '+971', 'UAE'),
  _Country('🇸🇦', '+966', 'Saudi Arabia'),
  _Country('🇦🇺', '+61', 'Australia'),
  _Country('🇩🇪', '+49', 'Germany'),
];

class VerificationScreen extends ConsumerStatefulWidget {
  const VerificationScreen({super.key});

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen> {
  // Async bootstrap
  bool _loading = true;
  bool _verified = false;
  String? _pendingStatus;

  // Wizard stages: 0 = intro, 1 = personal info, 2 = ID upload
  int _stage = 0;

  // Personal info
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  _Country _country = _countries.first;

  // ID upload
  XFile? _front, _back;
  final TextEditingController _idNumber = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _email = TextEditingController(text: user?.email ?? '');
    var phoneText = user?.phone ?? '';
    for (final c in _countries) {
      if (phoneText.startsWith(c.dial)) {
        _country = c;
        phoneText = phoneText.substring(c.dial.length).trim();
        break;
      }
    }
    _phone = TextEditingController(text: phoneText);
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _idNumber.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await ref.read(apiClientProvider).get('/verification');
      _verified = res.map['is_verified'] == true;
      _pendingStatus = (res.map['request'] as Map?)?['status'] as String?;
    } catch (_) {/* show form */}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _pickCountry() async {
    final picked = await showModalBottomSheet<_Country>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => ListView.builder(
        shrinkWrap: true,
        itemCount: _countries.length,
        itemBuilder: (_, i) {
          final c = _countries[i];
          return ListTile(
            leading: Text(c.flag, style: const TextStyle(fontSize: 24)),
            title: Text(c.name),
            trailing: Text(c.dial,
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.seed)),
            onTap: () => Navigator.of(ctx).pop(c),
          );
        },
      ),
    );
    if (picked != null) setState(() => _country = picked);
  }

  Future<void> _pickFile(void Function(XFile) assign) async {
    final x = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (x != null) setState(() => assign(x));
  }

  Future<void> _submit() async {
    if (_front == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Front document image is required')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final form = FormData();
      form.fields.add(const MapEntry('document_type', 'id_card'));
      form.fields.add(MapEntry('document_number', _idNumber.text.trim()));
      form.files.add(MapEntry(
        'front_image',
        MultipartFile.fromBytes(await _front!.readAsBytes(), filename: _front!.name),
      ));
      if (_back != null) {
        form.files.add(MapEntry(
          'back_image',
          MultipartFile.fromBytes(await _back!.readAsBytes(), filename: _back!.name),
        ));
      }
      await ref.read(apiClientProvider).upload('/verification', form);
      if (mounted) setState(() => _pendingStatus = 'pending');
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _back2() {
    if (_stage > 0) {
      setState(() => _stage--);
    } else {
      context.pop();
    }
  }

  void _skipForLater() => context.pop();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textDark),
          onPressed: _back2,
        ),
      ),
      body: _loading
          ? const LoadingView()
          : _verified
              ? _StatusBanner(
                  icon: Icons.verified,
                  color: const Color(0xFF1F8A6B),
                  title: 'You are verified',
                  message: 'The verified badge is on your profile.',
                )
              : _pendingStatus == 'pending'
                  ? _StatusBanner(
                      icon: Icons.hourglass_top,
                      color: AppTheme.accent,
                      title: 'Under review',
                      message: 'Your documents are being reviewed.',
                    )
                  : _buildStage(),
    );
  }

  Widget _buildStage() {
    switch (_stage) {
      case 0:
        return _IntroStage(
          onStart: () => setState(() => _stage = 1),
          onSkip: _skipForLater,
        );
      case 1:
        return _PersonalInfoStage(
          name: _name,
          email: _email,
          phone: _phone,
          country: _country,
          onPickCountry: _pickCountry,
          onContinue: () => setState(() => _stage = 2),
          onSkip: _skipForLater,
        );
      case 2:
      default:
        return _IdUploadStage(
          front: _front,
          back: _back,
          idNumber: _idNumber,
          onPickFront: () => _pickFile((x) => _front = x),
          onPickBack: () => _pickFile((x) => _back = x),
          submitting: _submitting,
          onSubmit: _submit,
          onSkip: _skipForLater,
        );
    }
  }
}

// ───────────────────────────── Stage 0 ─────────────────────────────────────

class _IntroStage extends StatelessWidget {
  const _IntroStage({required this.onStart, required this.onSkip});
  final VoidCallback onStart;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      child: Column(
        children: [
          const Spacer(flex: 1),
          // Decorative illustration — large shield + key composite.
          SizedBox(
            width: 220,
            height: 220,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    color: AppTheme.seed.withValues(alpha: 0.06),
                    shape: BoxShape.circle,
                  ),
                ),
                Positioned(
                  right: 16,
                  top: 24,
                  child: Container(
                    width: 100,
                    height: 130,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF6B6B).withValues(alpha: 0.85),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(50),
                        topRight: Radius.circular(50),
                        bottomLeft: Radius.circular(50),
                        bottomRight: Radius.circular(50),
                      ),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.check, color: Colors.white, size: 50),
                  ),
                ),
                Positioned(
                  left: 12,
                  top: 70,
                  child: Transform.rotate(
                    angle: -0.5,
                    child: const Icon(Icons.vpn_key,
                        size: 80, color: AppTheme.secondary),
                  ),
                ),
                Positioned(
                  bottom: 28,
                  child: Container(
                    width: 50,
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1F8A6B),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.lock_outline,
                        color: Colors.white, size: 26),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'User Verification',
            style: TextStyle(
              color: AppTheme.textDark,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'For your security and to meet regulatory standards, we need to verify your identity.\nIt will only take 2 minutes.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.6),
              fontSize: 15,
              height: 1.5,
            ),
          ),
          const Spacer(flex: 2),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: FilledButton(
              onPressed: onStart,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.seed,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              child: const Text('Start Verification'),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onSkip,
            child: const Text(
              'Skip for later',
              style: TextStyle(
                color: AppTheme.textDark,
                fontSize: 15,
                fontWeight: FontWeight.w700,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── Stage 1 ─────────────────────────────────────

class _PersonalInfoStage extends StatelessWidget {
  const _PersonalInfoStage({
    required this.name,
    required this.email,
    required this.phone,
    required this.country,
    required this.onPickCountry,
    required this.onContinue,
    required this.onSkip,
  });

  final TextEditingController name;
  final TextEditingController email;
  final TextEditingController phone;
  final _Country country;
  final VoidCallback onPickCountry;
  final VoidCallback onContinue;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const _StepHeader(step: 1, total: 2, title: 'Personal Information', subtitle: 'Please provide your accurate information'),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            children: [
              const _Label('Full Name'),
              _TextField(controller: name),
              const SizedBox(height: 18),
              const _Label('Phone Number'),
              _PhoneInput(
                country: country,
                controller: phone,
                onPickCountry: onPickCountry,
              ),
              const SizedBox(height: 18),
              const _Label('Email Address'),
              _TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
              ),
            ],
          ),
        ),
        _BottomActions(
          primaryLabel: 'Continue',
          onPrimary: onContinue,
          onSkip: onSkip,
        ),
      ],
    );
  }
}

// ───────────────────────────── Stage 2 ─────────────────────────────────────

class _IdUploadStage extends StatelessWidget {
  const _IdUploadStage({
    required this.front,
    required this.back,
    required this.idNumber,
    required this.onPickFront,
    required this.onPickBack,
    required this.submitting,
    required this.onSubmit,
    required this.onSkip,
  });

  final XFile? front;
  final XFile? back;
  final TextEditingController idNumber;
  final VoidCallback onPickFront;
  final VoidCallback onPickBack;
  final bool submitting;
  final VoidCallback onSubmit;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const _StepHeader(
          step: 2,
          total: 2,
          title: 'ID Verification',
          subtitle: 'Select a documents type below to confirm your identity',
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            children: [
              // Info banner
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, color: Color(0xFFB57F00), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Upload a clear photo of a government-issued ID. '
                        'Your documents are only visible to our verification team.',
                        style: TextStyle(
                          color: const Color(0xFFB57F00).withValues(alpha: 0.95),
                          fontSize: 13.5,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const _Label('ID Proof (Front)'),
              _FilePicker(
                file: front,
                onTap: onPickFront,
                helper: 'PNG or JPG image, up to 5 MB',
              ),
              const SizedBox(height: 18),
              const _Label('ID Proof (Back)'),
              _FilePicker(
                file: back,
                onTap: onPickBack,
                helper: 'PNG or JPG image, up to 5 MB',
              ),
              const SizedBox(height: 18),
              const _Label('ID document number'),
              _TextField(controller: idNumber),
            ],
          ),
        ),
        _BottomActions(
          primaryLabel: submitting ? 'Submitting…' : 'Continue',
          primaryLoading: submitting,
          onPrimary: submitting ? null : onSubmit,
          onSkip: onSkip,
        ),
      ],
    );
  }
}

// ─────────────────────── Shared widgets ─────────────────────────

class _StepHeader extends StatelessWidget {
  const _StepHeader({
    required this.step,
    required this.total,
    required this.title,
    required this.subtitle,
  });

  final int step;
  final int total;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final progress = step / total;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'User Verification',
                  style: TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                'Step $step of $total',
                style: TextStyle(
                  color: AppTheme.textDark.withValues(alpha: 0.55),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: AppTheme.textDark.withValues(alpha: 0.1),
              valueColor: const AlwaysStoppedAnimation(AppTheme.textDark),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            style: const TextStyle(
              color: AppTheme.textDark,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.6),
              fontSize: 15,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2),
      child: Text(
        text,
        style: const TextStyle(
          color: AppTheme.textDark,
          fontSize: 15,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _TextField extends StatelessWidget {
  const _TextField({required this.controller, this.keyboardType});
  final TextEditingController controller;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: _whiteCard(),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(color: AppTheme.textDark, fontSize: 16),
        decoration: const InputDecoration(
          filled: false,
          fillColor: Colors.transparent,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(vertical: 18),
        ),
      ),
    );
  }
}

class _PhoneInput extends StatelessWidget {
  const _PhoneInput({
    required this.country,
    required this.controller,
    required this.onPickCountry,
  });

  final _Country country;
  final TextEditingController controller;
  final VoidCallback onPickCountry;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: _whiteCard(),
      child: Row(
        children: [
          InkWell(
            onTap: onPickCountry,
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(country.flag, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 8),
                  Text(
                    country.dial,
                    style: const TextStyle(
                      color: AppTheme.textDark,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down,
                      color: AppTheme.seed, size: 20),
                ],
              ),
            ),
          ),
          Container(width: 1, height: 26, color: Colors.black12),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: AppTheme.textDark, fontSize: 16),
              decoration: const InputDecoration(
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isCollapsed: true,
              ),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }
}


class _FilePicker extends StatelessWidget {
  const _FilePicker({required this.file, required this.onTap, required this.helper});
  final XFile? file;
  final VoidCallback onTap;
  final String helper;

  @override
  Widget build(BuildContext context) {
    final selected = file != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: DottedBorder(
            child: Container(
              height: 64,
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    selected ? Icons.check_circle : Icons.add,
                    size: 22,
                    color: selected ? const Color(0xFF1F8A6B) : AppTheme.textDark,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    selected ? file!.name : 'Add File',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: selected ? AppTheme.textDark : AppTheme.textDark.withValues(alpha: 0.55),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          helper,
          style: const TextStyle(
            color: Color(0xFFD64545),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _BottomActions extends StatelessWidget {
  const _BottomActions({
    required this.primaryLabel,
    required this.onPrimary,
    required this.onSkip,
    this.primaryLoading = false,
  });

  final String primaryLabel;
  final VoidCallback? onPrimary;
  final VoidCallback onSkip;
  final bool primaryLoading;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 6, 20, 14),
        child: Column(
          children: [
            SizedBox(
              width: double.infinity,
              height: 56,
              child: FilledButton(
                onPressed: onPrimary,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.seed,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                child: primaryLoading
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.4, color: Colors.white),
                      )
                    : Text(primaryLabel),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: onSkip,
              child: const Text(
                'Skip for later',
                style: TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.color,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 72, color: color),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.textDark.withValues(alpha: 0.65),
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────────── Dashed border (no extra dep) ────────────────────────────

class DottedBorder extends StatelessWidget {
  const DottedBorder({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedPainter(),
      child: child,
    );
  }
}

class _DashedPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.textDark.withValues(alpha: 0.25)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    final radius = const Radius.circular(12);
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      radius,
    );
    final path = Path()..addRRect(rect);
    _drawDashed(canvas, path, paint, dash: 6, gap: 4);
  }

  void _drawDashed(Canvas canvas, Path source, Paint paint,
      {double dash = 5, double gap = 3}) {
    for (final metric in source.computeMetrics()) {
      var distance = 0.0;
      var draw = true;
      while (distance < metric.length) {
        final len = draw ? dash : gap;
        if (draw) {
          canvas.drawPath(
            metric.extractPath(distance, distance + len),
            paint,
          );
        }
        distance += len;
        draw = !draw;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ───────────────── Tiny helpers ─────────────────────────────

BoxDecoration _whiteCard() => BoxDecoration(
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
