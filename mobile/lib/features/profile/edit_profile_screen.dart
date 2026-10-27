import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart' show MultipartFile;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/storage/app_prefs.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/format.dart';
import '../auth/auth_controller.dart';
import '../auth/data/auth_repository.dart';

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
  _Country('🇵🇰', '+92', 'Pakistan'),
  _Country('🇧🇩', '+880', 'Bangladesh'),
];

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  late final TextEditingController _address;
  late _Country _country;
  late bool _notifications;
  late bool _showContact;
  bool _saving = false;
  XFile? _avatar;
  Uint8List? _avatarBytes;

  Future<void> _pickAvatar() async {
    final x = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1024, imageQuality: 85);
    if (x == null) return;
    final bytes = await x.readAsBytes();
    if (mounted) {
      setState(() {
        _avatar = x;
        _avatarBytes = bytes;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _email = TextEditingController(text: user?.email ?? '');
    _country = _countries.first;
    var phoneText = user?.phone ?? '';
    // Detect a leading +<dial> and split into picker + local number.
    for (final c in _countries) {
      if (phoneText.startsWith(c.dial)) {
        _country = c;
        phoneText = phoneText.substring(c.dial.length).trim();
        break;
      }
    }
    _phone = TextEditingController(text: phoneText);
    final prefs = ref.read(appPrefsProvider);
    _address = TextEditingController(text: prefs.address.isNotEmpty ? prefs.address : (user?.address ?? ''));
    _notifications = prefs.notificationsEnabled;
    _showContact = prefs.showContactInfo;
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final prefs = ref.read(appPrefsProvider);
    try {
      final phoneCombined = _phone.text.trim().isEmpty
          ? null
          : '${_country.dial}${_phone.text.trim()}';
      final user = await ref.read(authRepositoryProvider).updateProfile(
        {
          'name': _name.text.trim(),
          'email': _email.text.trim().isEmpty ? null : _email.text.trim(),
          'phone': phoneCombined,
          'address': _address.text.trim().isEmpty ? null : _address.text.trim(),
        },
        avatar: _avatar == null
            ? null
            : MultipartFile.fromBytes(_avatarBytes!, filename: _avatar!.name),
      );
      ref.read(authControllerProvider.notifier).setUser(user);
      // Device-local preferences (address is also mirrored locally for the header).
      await prefs.setAddress(_address.text.trim());
      await prefs.setNotificationsEnabled(_notifications);
      await prefs.setShowContactInfo(_showContact);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated')),
        );
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
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
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Edit Profile',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w700,
            fontSize: 19,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        children: [
          const SizedBox(height: 4),
          _AvatarRing(
            imageUrl: mediaUrl(ref.watch(authControllerProvider).user?.avatarPath),
            bytes: _avatarBytes,
            onEdit: _pickAvatar,
          ),
          const SizedBox(height: 22),
          _label('Full Name'),
          _input(controller: _name, hint: ''),
          const SizedBox(height: 18),
          _label('Email Address'),
          _input(
            controller: _email,
            hint: '',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 18),
          _label('Phone Number'),
          _phoneInput(),
          const SizedBox(height: 18),
          _label('Address'),
          _input(controller: _address, hint: '', maxLines: 2),
          const SizedBox(height: 18),
          _label('Notification'),
          _toggleRow(
            value: _notifications,
            onChanged: (v) => setState(() => _notifications = v),
          ),
          const SizedBox(height: 18),
          _label('Show Contact Info'),
          _toggleRow(
            value: _showContact,
            onChanged: (v) => setState(() => _showContact = v),
          ),
          const SizedBox(height: 28),
          SizedBox(
            height: 56,
            child: FilledButton(
              onPressed: _saving ? null : _save,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.seed,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              child: _saving
                  ? const SizedBox(
                      height: 22, width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                    )
                  : const Text('Update Profile'),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────── Tiny field helpers ───────────────

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 2),
      child: Text(
        text,
        style: const TextStyle(
          color: AppTheme.textDark,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _input({
    required TextEditingController controller,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      decoration: _fieldDecoration(),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        style: const TextStyle(
          color: AppTheme.textDark,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          border: InputBorder.none,
          isCollapsed: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFFB0B0BD)),
        ),
      ),
    );
  }

  Widget _phoneInput() {
    return Container(
      decoration: _fieldDecoration(),
      child: Row(
        children: [
          InkWell(
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
            onTap: _pickCountry,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
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
                      fontWeight: FontWeight.w700,
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
            child: TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              decoration: const InputDecoration(
                border: InputBorder.none,
                isCollapsed: true,
                hintText: '81234 56789',
                hintStyle: TextStyle(color: Color(0xFFB0B0BD)),
              ),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }

  Widget _toggleRow({required bool value, required ValueChanged<bool> onChanged}) {
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: _fieldDecoration(),
      child: Row(
        children: [
          Expanded(
            child: Text(
              value ? 'Enabled' : 'Disabled',
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 17,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: Colors.white,
            activeTrackColor: AppTheme.seed,
            inactiveThumbColor: Colors.white,
            inactiveTrackColor: AppTheme.textDark.withValues(alpha: 0.2),
            trackOutlineColor: WidgetStatePropertyAll(Colors.transparent),
          ),
        ],
      ),
    );
  }

  BoxDecoration _fieldDecoration() {
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
}

// ─────────────── Avatar with edit pencil ───────────────

class _AvatarRing extends StatelessWidget {
  const _AvatarRing({this.imageUrl, this.bytes, required this.onEdit});
  final String? imageUrl;
  final Uint8List? bytes;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: 144,
        height: 144,
        child: Stack(
          children: [
            // Outer thin ring
            Container(
              width: 144,
              height: 144,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.seed, width: 1.5),
              ),
              padding: const EdgeInsets.all(6),
              // Inner filled circle
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.seed.withValues(alpha: 0.08),
                  border: Border.all(color: Colors.white, width: 3),
                ),
                alignment: Alignment.center,
                clipBehavior: Clip.antiAlias,
                child: bytes != null
                    ? Image.memory(bytes!, width: 132, height: 132, fit: BoxFit.cover)
                    : imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: imageUrl!,
                        width: 132,
                        height: 132,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) =>
                            const Icon(Icons.person_outline, size: 60, color: AppTheme.seed),
                      )
                    : const Icon(Icons.person_outline, size: 60, color: AppTheme.seed),
              ),
            ),
            // Edit pencil
            Positioned(
              right: 4,
              bottom: 4,
              child: GestureDetector(
                onTap: onEdit,
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: const BoxDecoration(
                    color: AppTheme.seed,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.edit_outlined, color: Colors.white, size: 18),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
