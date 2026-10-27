import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Full-screen, pinch-to-zoom image viewer.
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key, required this.images, this.initial = 0});
  final List<String> images;
  final int initial;

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  late final PageController _ctrl = PageController(initialPage: widget.initial);
  late int _index = widget.initial;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text('${_index + 1} / ${widget.images.length}'),
      ),
      body: PageView.builder(
        controller: _ctrl,
        onPageChanged: (i) => setState(() => _index = i),
        itemCount: widget.images.length,
        itemBuilder: (_, i) => InteractiveViewer(
          minScale: 1,
          maxScale: 5,
          child: Center(
            child: CachedNetworkImage(
              imageUrl: widget.images[i],
              fit: BoxFit.contain,
              placeholder: (_, __) => const CircularProgressIndicator(color: Colors.white),
              errorWidget: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.white54, size: 64),
            ),
          ),
        ),
      ),
    );
  }
}
