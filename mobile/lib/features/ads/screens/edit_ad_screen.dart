import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/widgets/state_views.dart';
import '../ads_repository.dart';

class EditAdScreen extends ConsumerStatefulWidget {
  const EditAdScreen({super.key, required this.id});
  final int id;

  @override
  ConsumerState<EditAdScreen> createState() => _EditAdScreenState();
}

class _EditAdScreenState extends ConsumerState<EditAdScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  String _priceType = 'fixed';
  String? _condition;
  bool _loading = true;
  bool _saving = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final Ad ad = await ref.read(adsRepositoryProvider).fetchForEdit(widget.id);
      _title.text = ad.title;
      _description.text = ad.description;
      if (ad.priceMinor != null) {
        final major = ad.priceMinor! / 100;
        _price.text = major == major.roundToDouble() ? major.toInt().toString() : major.toStringAsFixed(2);
      }
      _priceType = ad.priceType;
      _condition = ad.condition;
    } on ApiException catch (e) {
      _loadError = e.message;
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _description.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Title and description are required')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final res = await ref.read(apiClientProvider).put('/ads/${widget.id}', body: {
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        if (_price.text.trim().isNotEmpty) 'price': num.tryParse(_price.text.trim()),
        'price_type': _priceType,
        'condition': _condition,
      });
      if (mounted) {
        final pending = res.map['status'] == 'pending';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(pending ? 'Ad updated — it is back in review' : 'Ad updated'),
        ));
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Ad')),
      body: _loading
          ? const LoadingView()
          : _loadError != null
          ? ErrorView(message: _loadError!, onRetry: () {
              setState(() {
                _loading = true;
                _loadError = null;
              });
              _load();
            })
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 14),
                TextField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(child: TextField(controller: _price, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price'))),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _priceType,
                      decoration: const InputDecoration(labelText: 'Price type'),
                      items: const [
                        DropdownMenuItem(value: 'fixed', child: Text('Fixed')),
                        DropdownMenuItem(value: 'negotiable', child: Text('Negotiable')),
                        DropdownMenuItem(value: 'free', child: Text('Free')),
                        DropdownMenuItem(value: 'contact', child: Text('Contact')),
                      ],
                      onChanged: (v) => setState(() => _priceType = v ?? 'fixed'),
                    ),
                  ),
                ]),
                const SizedBox(height: 14),
                DropdownButtonFormField<String?>(
                  initialValue: _condition,
                  decoration: const InputDecoration(labelText: 'Condition'),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('—')),
                    DropdownMenuItem(value: 'new', child: Text('New')),
                    DropdownMenuItem(value: 'used', child: Text('Used')),
                    DropdownMenuItem(value: 'refurbished', child: Text('Refurbished')),
                  ],
                  onChanged: (v) => setState(() => _condition = v),
                ),
                const SizedBox(height: 24),
                FilledButton(onPressed: _saving ? null : _save, child: _saving ? const Text('Saving…') : const Text('Save changes')),
              ],
            ),
    );
  }
}
