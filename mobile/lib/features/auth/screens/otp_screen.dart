import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../auth_controller.dart';
import '../data/auth_repository.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.identifier, required this.purpose, this.debugCode});
  final String identifier;
  final String purpose;
  final String? debugCode;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  late final TextEditingController _code = TextEditingController(text: widget.debugCode ?? '');
  bool _loading = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      await ref.read(authRepositoryProvider).verifyOtp(widget.identifier, widget.purpose, _code.text.trim());
      await ref.read(authControllerProvider.notifier).refresh();
      if (mounted) context.go('/home');
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.mark_email_read_outlined, size: 64, color: Color(0xFF272757)),
              const SizedBox(height: 16),
              Text('Enter the code sent to ${widget.identifier}',
                  textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
              if (widget.debugCode != null) ...[
                const SizedBox(height: 8),
                Text('Dev code: ${widget.debugCode}',
                    textAlign: TextAlign.center, style: const TextStyle(color: Colors.orange)),
              ],
              const SizedBox(height: 24),
              TextField(
                controller: _code,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, letterSpacing: 8),
                decoration: const InputDecoration(hintText: '••••••'),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _verify,
                child: _loading
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : const Text('Verify'),
              ),
              TextButton(
                onPressed: () async {
                  final channel = widget.identifier.contains('@') ? 'email' : 'sms';
                  await ref.read(authRepositoryProvider).sendOtp(widget.identifier, channel, widget.purpose);
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code resent')));
                },
                child: const Text('Resend code'),
              ),
              TextButton(onPressed: () => context.go('/home'), child: const Text('Skip for now')),
            ],
          ),
        ),
      ),
    );
  }
}
