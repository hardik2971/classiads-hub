import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../shared/models/category.dart';
import '../../catalog/catalog_repository.dart';
import '../ads_repository.dart';
import 'my_ads_screen.dart' show myAdsProvider;

class _Opt {
  _Opt(this.id, this.label);
  final int id;
  final String label;
}

List<_Opt> _flatten(List<Category> cats, [int depth = 0]) {
  final out = <_Opt>[];
  for (final c in cats) {
    out.add(_Opt(c.id, '${'   ' * depth}${c.name}'));
    out.addAll(_flatten(c.children, depth + 1));
  }
  return out;
}

class PostAdScreen extends ConsumerStatefulWidget {
  const PostAdScreen({super.key});

  @override
  ConsumerState<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends ConsumerState<PostAdScreen> {
  final _form = GlobalKey<FormState>();
  int? _categoryId;
  String _priceType = 'fixed';
  String? _condition;
  int? _countryId, _stateId, _cityId;
  final _values = <String, String>{};
  final _cf = <String, String>{};
  List<CustomField> _fields = [];
  List<_Opt> _countries = [], _states = [], _cities = [];
  final List<XFile> _images = [];
  bool _submitting = false;

  Future<void> _pickImages() async {
    final picked = await ImagePicker().pickMultiImage();
    if (picked.isNotEmpty) setState(() => _images.addAll(picked.take(10 - _images.length)));
  }

  @override
  void initState() {
    super.initState();
    _loadCountries();
  }

  Future<List<_Opt>> _fetch(String path, [Map<String, dynamic>? q]) async {
    final res = await ref.read(apiClientProvider).get(path, query: q);
    return res.list.map((e) => _Opt((e['id'] as num).toInt(), e['name'] as String)).toList();
  }

  Future<void> _loadCountries() async {
    try {
      final c = await _fetch('/locations/countries');
      if (mounted) setState(() => _countries = c);
    } catch (_) {/* location stays optional */}
  }

  Future<void> _onCategory(int id) async {
    setState(() {
      _categoryId = id;
      _fields = [];
      _cf.clear();
    });
    try {
      final f = await ref.read(catalogRepositoryProvider).customFields(id);
      if (mounted && _categoryId == id) setState(() => _fields = f);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not load category fields: $e')));
      }
    }
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pick a category and fill required fields')));
      return;
    }
    final priceText = (_values['price'] ?? '').trim().replaceAll(',', '');
    final price = priceText.isEmpty ? null : num.tryParse(priceText);
    if (priceText.isNotEmpty && price == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid price')));
      return;
    }
    setState(() => _submitting = true);
    try {
      final repo = ref.read(adsRepositoryProvider);
      final ad = await repo.create({
        'category_id': _categoryId,
        'title': _values['title'],
        'description': _values['description'],
        'price': price,
        'price_type': _priceType,
        'condition': _condition,
        'phone': _values['phone'],
        'country_id': _countryId,
        'state_id': _stateId,
        'city_id': _cityId,
        'custom_fields': {
          for (final e in _cf.entries)
            if (e.value.trim().isNotEmpty) e.key: e.value.trim(),
        },
      });
      String? imageError;
      if (_images.isNotEmpty) {
        try {
          final files = <MultipartFile>[];
          for (final x in _images) {
            files.add(MultipartFile.fromBytes(await x.readAsBytes(), filename: x.name));
          }
          await repo.uploadImages(ad.id, files);
        } on ApiException catch (e) {
          // The ad exists already — tell the user, don't pretend the whole post failed.
          imageError = e.message;
        }
      }
      if (mounted) {
        final msg = imageError != null
            ? 'Ad posted, but photos failed to upload: $imageError'
            : ad.status == 'pending'
            ? 'Ad submitted for approval'
            : 'Ad published!';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        ref.invalidate(myAdsProvider);
        context.go('/myads');
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not post the ad: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Post an Ad')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            cats.when(
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('$e'),
              data: (list) => DropdownButtonFormField<int>(
                initialValue: _categoryId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Category *'),
                items: _flatten(list).map((o) => DropdownMenuItem(value: o.id, child: Text(o.label, overflow: TextOverflow.ellipsis))).toList(),
                onChanged: (v) => v != null ? _onCategory(v) : null,
              ),
            ),
            const SizedBox(height: 12),
            _text('title', 'Title *', required: true, minLength: 3),
            _text('description', 'Description *', required: true, maxLines: 4, minLength: 10),
            Row(children: [
              Expanded(child: _text('price', 'Price', keyboard: TextInputType.number)),
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
            const SizedBox(height: 12),
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
            const SizedBox(height: 12),
            _text('phone', 'Phone'),
            // Dynamic custom fields
            for (final f in _fields) _customField(f),
            const SizedBox(height: 8),
            const Text('Location', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _locationDropdown('Country', _countryId, _countries, (v) async {
              setState(() { _countryId = v; _stateId = null; _cityId = null; _states = []; _cities = []; });
              if (v != null) { final s = await _fetch('/locations/states', {'country_id': v}); if (mounted) setState(() => _states = s); }
            }),
            _locationDropdown('State', _stateId, _states, (v) async {
              setState(() { _stateId = v; _cityId = null; _cities = []; });
              if (v != null) { final c = await _fetch('/locations/cities', {'state_id': v}); if (mounted) setState(() => _cities = c); }
            }),
            _locationDropdown('City', _cityId, _cities, (v) => setState(() => _cityId = v)),
            const SizedBox(height: 12),
            const Text('Photos', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            SizedBox(
              height: 84,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (var i = 0; i < _images.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: FutureBuilder(
                              future: _images[i].readAsBytes(),
                              builder: (_, snap) => snap.hasData
                                  ? Image.memory(snap.data!, width: 80, height: 80, fit: BoxFit.cover)
                                  : Container(width: 80, height: 80, color: Colors.black12),
                            ),
                          ),
                          Positioned(
                            right: 0, top: 0,
                            child: GestureDetector(
                              onTap: () => setState(() => _images.removeAt(i)),
                              child: const CircleAvatar(radius: 11, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 14, color: Colors.white)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (_images.length < 10)
                    InkWell(
                      onTap: _pickImages,
                      child: Container(
                        width: 80, height: 80,
                        decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.black26)),
                        child: const Icon(Icons.add_a_photo_outlined, color: Colors.black45),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : const Text('Publish Ad'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _text(String key, String label,
      {bool required = false, int maxLines = 1, int minLength = 0, TextInputType? keyboard}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        decoration: InputDecoration(labelText: label),
        maxLines: maxLines,
        keyboardType: keyboard,
        onChanged: (v) => _values[key] = v,
        validator: required
            ? (v) => (v == null || v.trim().isEmpty)
                ? 'Required'
                : v.trim().length < minLength
                ? 'At least $minLength characters'
                : null
            : null,
      ),
    );
  }

  Widget _customField(CustomField f) {
    if (f.hasOptions) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: DropdownButtonFormField<String>(
          key: ValueKey('cf-$_categoryId-${f.code}'),
          initialValue: _cf[f.code],
          decoration: InputDecoration(labelText: '${f.name}${f.isRequired ? ' *' : ''}'),
          items: f.options.map((o) => DropdownMenuItem(value: o.value, child: Text(o.label))).toList(),
          onChanged: (v) => setState(() => _cf[f.code] = v ?? ''),
          validator: f.isRequired ? (v) => (v == null || v.isEmpty) ? 'Required' : null : null,
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        key: ValueKey('cf-$_categoryId-${f.code}'),
        decoration: InputDecoration(labelText: '${f.name}${f.isRequired ? ' *' : ''}'),
        keyboardType: f.type == 'number' ? TextInputType.number : TextInputType.text,
        onChanged: (v) => _cf[f.code] = v,
        validator: f.isRequired ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null,
      ),
    );
  }

  Widget _locationDropdown(String label, int? value, List<_Opt> opts, void Function(int?) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<int>(
        key: ValueKey('$label-${opts.length}-${opts.isEmpty ? 0 : opts.first.id}-$value'),
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: opts.map((o) => DropdownMenuItem(value: o.id, child: Text(o.label))).toList(),
        onChanged: opts.isEmpty ? null : onChanged,
      ),
    );
  }
}
