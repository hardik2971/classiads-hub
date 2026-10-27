import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';

/// Write/submit a review for a seller (#21).
class WriteReviewScreen extends ConsumerStatefulWidget {
  const WriteReviewScreen({super.key, required this.sellerId, this.adId});
  final int sellerId;
  final int? adId;

  @override
  ConsumerState<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends ConsumerState<WriteReviewScreen> {
  int _rating = 5;
  final _comment = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    try {
      await ref.read(apiClientProvider).post('/reviews', body: {
        'reviewee_id': widget.sellerId,
        if (widget.adId != null) 'ad_id': widget.adId,
        'rating': _rating,
        'comment': _comment.text.trim(),
        'type': 'seller_review',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review submitted!')));
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
      appBar: AppBar(title: const Text('Write a Review')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Rate this seller', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (i) {
              final filled = i < _rating;
              return IconButton(
                onPressed: () => setState(() => _rating = i + 1),
                icon: Icon(filled ? Icons.star : Icons.star_border, color: Colors.amber, size: 36),
              );
            }),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _comment,
            maxLines: 5,
            decoration: const InputDecoration(labelText: 'Your review', alignLabelWithHint: true),
          ),
          const SizedBox(height: 24),
          FilledButton(onPressed: _saving ? null : _submit, child: Text(_saving ? 'Submitting…' : 'Submit Review')),
        ],
      ),
    );
  }
}
