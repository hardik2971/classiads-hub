import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../data/auth_repository.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _login = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  int _step = 1;
  String? _debug;
  bool _loading = false;

  @override
  void dispose() {
    _login.dispose();
    _code.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    setState(() => _loading = true);
    try {
      final code = await ref.read(authRepositoryProvider).forgotPassword(_login.text.trim());
      setState(() {
        _debug = code;
        if (code != null) _code.text = code;
        _step = 2;
      });
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reset() async {
    setState(() => _loading = true);
    try {
      await ref.read(authRepositoryProvider).resetPassword(_login.text.trim(), _code.text.trim(), _password.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password reset — please log in')));
        context.go('/login');
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_step == 1) ...[
                const Text('Enter your email or phone to receive a reset code.'),
                const SizedBox(height: 16),
                TextField(controller: _login, decoration: const InputDecoration(labelText: 'Email or phone')),
                const SizedBox(height: 20),
                FilledButton(onPressed: _loading ? null : _request, child: const Text('Send reset code')),
              ] else ...[
                if (_debug != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text('Dev code: $_debug', style: const TextStyle(color: Colors.orange)),
                  ),
                TextField(controller: _code, decoration: const InputDecoration(labelText: 'Reset code')),
                const SizedBox(height: 14),
                TextField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'New password'),
                ),
                const SizedBox(height: 20),
                FilledButton(onPressed: _loading ? null : _reset, child: const Text('Reset password')),
              ],
              TextButton(onPressed: () => context.go('/login'), child: const Text('Back to login')),
            ],
          ),
        ),
      ),
    );
  }
}
