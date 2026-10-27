import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/firebase/firebase_auth_service.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/snackbar.dart';
import '../auth_controller.dart';

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
  _Country('🇨🇦', '+1', 'Canada'),
  _Country('🇩🇪', '+49', 'Germany'),
  _Country('🇫🇷', '+33', 'France'),
  _Country('🇪🇸', '+34', 'Spain'),
  _Country('🇧🇷', '+55', 'Brazil'),
  _Country('🇿🇦', '+27', 'South Africa'),
  _Country('🇳🇬', '+234', 'Nigeria'),
  _Country('🇰🇪', '+254', 'Kenya'),
  _Country('🇵🇰', '+92', 'Pakistan'),
  _Country('🇧🇩', '+880', 'Bangladesh'),
];

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  _Country _country = _countries.first;
  bool _emailMode = false;     // false → phone, true → email
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final login = _emailMode
        ? _identifier.text.trim()
        : '${_country.dial}${_identifier.text.trim()}';
    setState(() => _loading = true);
    try {
      await ref.read(authControllerProvider.notifier).login(login, _password.text);
      // Router redirect handles navigation on auth state change.
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _continueWithGoogle() async {
    setState(() => _loading = true);
    try {
      final result = await ref.read(firebaseAuthServiceProvider).signInWithGoogle();
      // The API links/provisions the app profile for this Firebase identity.
      await ref.read(authControllerProvider.notifier).completeProviderSignIn();
      if (!mounted) return;
      showSnack(context, 'Signed in as ${result.user.email ?? result.user.uid}');
      context.go('/home');
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        showSnack(context, e.message ?? 'Google sign-in failed', error: true);
      }
    } catch (_) {
      if (mounted) showSnack(context, 'Google sign-in failed', error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _form,
                // Re-check as the user types so a fixed field clears its error.
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _skipBar(context),
                    const SizedBox(height: 24),
                    const Text(
                      'Welcome back',
                      style: TextStyle(
                        color: AppTheme.textDark,
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _emailMode ? 'Login with Email' : 'Login with Phone Number',
                      style: TextStyle(
                        color: AppTheme.textDark.withValues(alpha: 0.55),
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 28),

                    if (_emailMode) _emailField() else _phoneField(),
                    const SizedBox(height: 14),
                    _passwordField(),

                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.textDark.withValues(alpha: 0.65),
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Forgot Password?',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    _continueButton(),
                    const SizedBox(height: 18),

                    _signUpRow(context),
                    const SizedBox(height: 22),

                    Text(
                      'Or sign in with',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.textDark.withValues(alpha: 0.75),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 14),

                    _socialButton(
                      label: 'Continue with Google',
                      iconBuilder: _googleIcon,
                      onTap: _loading ? null : _continueWithGoogle,
                    ),
                    const SizedBox(height: 10),
                    _socialButton(
                      label: _emailMode ? 'Continue with Phone' : 'Continue with Email',
                      iconBuilder: (size) => Icon(
                        _emailMode ? Icons.phone_outlined : Icons.mail_outline,
                        size: size,
                        color: AppTheme.textDark,
                      ),
                      onTap: () => setState(() {
                        _emailMode = !_emailMode;
                        _identifier.clear();
                      }),
                    ),

                    const SizedBox(height: 36),
                    _legalFooter(context),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────── Components ───────────────

  Widget _skipBar(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: TextButton(
        onPressed: () => context.go('/home'),
        style: TextButton.styleFrom(
          backgroundColor: AppTheme.accent,
          foregroundColor: AppTheme.textDark,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
        child: const Text('Skip'),
      ),
    );
  }

  Widget _phoneField() {
    return Container(
      decoration: _fieldDecoration(),
      child: Row(
        children: [
          InkWell(
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
            onTap: _pickCountry,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_country.flag, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 8),
                  Text(
                    _country.dial,
                    style: const TextStyle(
                      color: AppTheme.textDark,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down, color: AppTheme.seed, size: 20),
                ],
              ),
            ),
          ),
          Container(width: 1, height: 28, color: Colors.black12),
          const SizedBox(width: 12),
          Expanded(
            child: TextFormField(
              controller: _identifier,
              keyboardType: TextInputType.phone,
              autofillHints: const [AutofillHints.telephoneNumberNational],
              decoration: _borderlessDecoration(hint: '81234 56789'),
              style: const TextStyle(fontSize: 16, color: AppTheme.textDark),
              validator: (v) =>
                  (v == null || v.trim().length < 6) ? 'Enter your phone number' : null,
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }

  Widget _emailField() {
    return Container(
      decoration: _fieldDecoration(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextFormField(
        controller: _identifier,
        keyboardType: TextInputType.emailAddress,
        autofillHints: const [AutofillHints.email],
        decoration: _borderlessDecoration(
          hint: 'you@example.com',
          icon: const Icon(Icons.mail_outline, color: AppTheme.seed),
        ),
        style: const TextStyle(fontSize: 16, color: AppTheme.textDark),
        validator: (v) =>
            (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
      ),
    );
  }

  Widget _passwordField() {
    return Container(
      decoration: _fieldDecoration(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextFormField(
        controller: _password,
        obscureText: _obscure,
        autofillHints: const [AutofillHints.password],
        decoration: _borderlessDecoration(
          hint: 'Password',
          suffixIcon: IconButton(
            icon: Icon(
              _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: AppTheme.textDark.withValues(alpha: 0.45),
            ),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        ),
        style: const TextStyle(fontSize: 16, color: AppTheme.textDark),
        validator: (v) =>
            (v == null || v.length < 6) ? 'Password must be at least 6 characters' : null,
      ),
    );
  }

  Widget _continueButton() {
    return SizedBox(
      height: 56,
      child: FilledButton(
        onPressed: _loading ? null : _submit,
        style: FilledButton.styleFrom(
          backgroundColor: AppTheme.seed,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        child: _loading
            ? const SizedBox(
                height: 22, width: 22,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
              )
            : const Text('Continue'),
      ),
    );
  }

  Widget _signUpRow(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Don't have an account? ",
          style: TextStyle(
            color: AppTheme.textDark.withValues(alpha: 0.7),
            fontSize: 15,
          ),
        ),
        GestureDetector(
          onTap: () => context.push('/register'),
          child: const Text(
            'Sign up',
            style: TextStyle(
              color: AppTheme.seed,
              fontSize: 15,
              fontWeight: FontWeight.w700,
              decoration: TextDecoration.underline,
              decorationColor: AppTheme.seed,
            ),
          ),
        ),
      ],
    );
  }

  Widget _socialButton({
    required String label,
    required Widget Function(double size) iconBuilder,
    required VoidCallback? onTap,
  }) {
    return SizedBox(
      height: 54,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.textDark,
          side: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            iconBuilder(22),
            const SizedBox(width: 12),
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _googleIcon(double size) {
    return SizedBox(
      height: size,
      width: size,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }

  Widget _legalFooter(BuildContext context) {
    final muted = AppTheme.textDark.withValues(alpha: 0.65);
    return Center(
      child: RichText(
        textAlign: TextAlign.center,
        text: TextSpan(
          style: TextStyle(color: muted, fontSize: 13, height: 1.4),
          children: [
            const TextSpan(text: 'By Signing Up/Logging in, You agree to our\n'),
            _legalLink('Terms of Service', () => context.push('/page/terms')),
            const TextSpan(text: ' and '),
            _legalLink('Privacy Policy', () => context.push('/page/privacy')),
          ],
        ),
      ),
    );
  }

  TextSpan _legalLink(String text, VoidCallback onTap) {
    return TextSpan(
      text: text,
      recognizer: _TapGestureLink(onTap),
      style: const TextStyle(
        color: AppTheme.seed,
        fontWeight: FontWeight.w700,
        decoration: TextDecoration.underline,
        decorationColor: AppTheme.seed,
      ),
    );
  }

  BoxDecoration _fieldDecoration() {
    // White rounded card. The TextField inside is fully transparent
    // (no inner fill, no border, no focus ring) so the card alone defines the visual.
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

  /// Fully transparent input — no fill, no border in any state, no focus ring.
  /// Overrides the global InputDecorationTheme defaults explicitly.
  InputDecoration _borderlessDecoration({
    required String hint,
    Widget? icon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      filled: false,
      fillColor: Colors.transparent,
      border: InputBorder.none,
      enabledBorder: InputBorder.none,
      focusedBorder: InputBorder.none,
      errorBorder: InputBorder.none,
      focusedErrorBorder: InputBorder.none,
      disabledBorder: InputBorder.none,
      contentPadding: const EdgeInsets.symmetric(vertical: 18),
      icon: icon,
      suffixIcon: suffixIcon,
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFFB0B0BD)),
    );
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
            trailing: Text(
              c.dial,
              style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.seed),
            ),
            onTap: () => Navigator.of(ctx).pop(c),
          );
        },
      ),
    );
    if (picked != null) setState(() => _country = picked);
  }
}

// Inline "G" mark — saves us a Google logo asset while staying recognisable.
class _GoogleGPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..style = PaintingStyle.fill;
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;
    // Quarter arcs in Google's four-color palette.
    final rect = Rect.fromCircle(center: c, radius: r);
    p.color = const Color(0xFF4285F4);
    canvas.drawArc(rect, -0.4, 1.6, true, p);
    p.color = const Color(0xFF34A853);
    canvas.drawArc(rect, 1.2, 1.4, true, p);
    p.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect, 2.6, 1.4, true, p);
    p.color = const Color(0xFFEA4335);
    canvas.drawArc(rect, 4.0, 1.4, true, p);
    // Centre cut + the white "G" cross-bar — kept minimal.
    p.color = Colors.white;
    canvas.drawCircle(c, r * 0.55, p);
    p.color = const Color(0xFF4285F4);
    canvas.drawRect(
      Rect.fromLTWH(c.dx, c.dy - r * 0.1, r * 0.55, r * 0.2),
      p,
    );
  }

  @override
  bool shouldRepaint(_) => false;
}

// TextSpan recognizer helper for tapping inline links.
class _TapGestureLink extends TapGestureRecognizer {
  _TapGestureLink(VoidCallback handler) {
    onTap = handler;
  }
}
