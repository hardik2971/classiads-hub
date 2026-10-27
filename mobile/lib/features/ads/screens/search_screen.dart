import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/paginated.dart';
import '../../../shared/models/ad.dart';
import '../../../shared/widgets/ad_card.dart';
import '../../../shared/widgets/state_views.dart';
import '../ads_repository.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.query, this.categorySlug, this.title});
  final String? query;
  final String? categorySlug;
  final String? title;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _q = TextEditingController(text: widget.query ?? '');
  String _sort = '';
  String? _condition;
  String? _categorySlug;
  String? _priceMin;
  String? _priceMax;
  Future<Paginated<Ad>>? _future;

  @override
  void initState() {
    super.initState();
    _categorySlug = widget.categorySlug;
    _run();
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  void _run() {
    final filters = <String, dynamic>{
      if (_q.text.trim().isNotEmpty) 'q': _q.text.trim(),
      if (_categorySlug != null) 'category_slug': _categorySlug,
      if (_condition != null) 'condition': _condition,
      if (_priceMin != null) 'price_min': _priceMin,
      if (_priceMax != null) 'price_max': _priceMax,
      if (_sort.isNotEmpty) 'sort': _sort,
      'per_page': 30,
    };
    setState(() => _future = ref.read(adsRepositoryProvider).search(filters));
  }

  Future<void> _openFilters() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FilterSheet(
        sort: _sort,
        condition: _condition,
        priceMin: _priceMin,
        priceMax: _priceMax,
        onApply: (sort, condition, min, max) {
          _sort = sort;
          _condition = condition;
          _priceMin = min;
          _priceMax = max;
          _run();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _q,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _run(),
          decoration: const InputDecoration(hintText: 'Search…', border: InputBorder.none),
        ),
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _openFilters)],
      ),
      body: FutureBuilder<Paginated<Ad>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) return const LoadingView();
          if (snap.hasError) return ErrorView(message: '${snap.error}', onRetry: _run);
          final ads = snap.data?.items ?? [];
          if (ads.isEmpty) return const EmptyView(message: 'No listings found', icon: Icons.search_off);
          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 240, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
            itemCount: ads.length,
            itemBuilder: (_, i) => AdCard(ad: ads[i]),
          );
        },
      ),
    );
  }
}

class _FilterSheet extends ConsumerStatefulWidget {
  const _FilterSheet({required this.sort, this.condition, this.priceMin, this.priceMax, required this.onApply});
  final String sort;
  final String? condition;
  final String? priceMin;
  final String? priceMax;
  final void Function(String sort, String? condition, String? min, String? max) onApply;

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  late String _sort = widget.sort;
  late String? _condition = widget.condition;
  late final _min = TextEditingController(text: widget.priceMin);
  late final _max = TextEditingController(text: widget.priceMax);

  @override
  void dispose() {
    _min.dispose();
    _max.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Filters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const Text('Sort by'),
          Wrap(
            spacing: 8,
            children: [
              for (final s in const [['', 'Relevance'], ['newest', 'Newest'], ['price_asc', 'Price ↑'], ['price_desc', 'Price ↓'], ['most_viewed', 'Most viewed']])
                ChoiceChip(label: Text(s[1]), selected: _sort == s[0], onSelected: (_) => setState(() => _sort = s[0])),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Condition'),
          Wrap(
            spacing: 8,
            children: [
              for (final c in const [null, 'new', 'used', 'refurbished'])
                ChoiceChip(label: Text(c ?? 'Any'), selected: _condition == c, onSelected: (_) => setState(() => _condition = c)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: TextField(controller: _min, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Min price'))),
              const SizedBox(width: 12),
              Expanded(child: TextField(controller: _max, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max price'))),
            ],
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              widget.onApply(_sort, _condition, _min.text.trim().isEmpty ? null : _min.text.trim(), _max.text.trim().isEmpty ? null : _max.text.trim());
              Navigator.pop(context);
            },
            child: const Text('Apply filters'),
          ),
        ],
      ),
    );
  }
}
