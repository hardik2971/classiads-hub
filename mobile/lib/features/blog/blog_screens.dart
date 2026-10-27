import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../../core/utils/format.dart';
import '../../shared/widgets/state_views.dart';
import '../../shared/widgets/html_text.dart';

class BlogPost {
  BlogPost(this.title, this.slug, this.excerpt, this.cover, this.body, this.publishedAt, this.author);
  final String title;
  final String slug;
  final String? excerpt;
  final String? cover;
  final String? body;
  final String? publishedAt;
  final String? author;
  factory BlogPost.fromJson(Map<String, dynamic> j) => BlogPost(
        j['title'] as String? ?? '',
        j['slug'] as String? ?? '',
        j['excerpt'] as String?,
        j['cover_image'] as String?,
        j['body'] as String?,
        j['published_at'] as String?,
        (j['author'] as Map?)?['name'] as String?,
      );
}

final _blogProvider = FutureProvider.autoDispose<List<BlogPost>>((ref) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/blog');
      return res.list.map((e) => BlogPost.fromJson(e as Map<String, dynamic>)).toList();
    },
    () => DummyData.blogPosts().map((e) => BlogPost.fromJson(e)).toList(),
  );
});

class BlogListScreen extends ConsumerWidget {
  const BlogListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(_blogProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Blog')),
      body: posts.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(_blogProvider)),
        data: (list) {
          if (list.isEmpty) return const EmptyView(message: 'No posts yet', icon: Icons.article_outlined);
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final p = list[i];
              final img = mediaUrl(p.cover);
              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => context.push('/blog/${p.slug}'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (img != null) AspectRatio(aspectRatio: 16 / 9, child: CachedNetworkImage(imageUrl: img, fit: BoxFit.cover)),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            if (p.excerpt != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(p.excerpt!, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.black54))),
                            Padding(padding: const EdgeInsets.only(top: 6), child: Text(timeAgo(p.publishedAt), style: const TextStyle(fontSize: 11, color: Colors.black45))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

final _postProvider = FutureProvider.autoDispose.family<BlogPost, String>((ref, slug) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/blog/$slug');
      return BlogPost.fromJson(res.map);
    },
    () => BlogPost.fromJson(DummyData.blogPosts().first),
  );
});

class BlogDetailScreen extends ConsumerWidget {
  const BlogDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final post = ref.watch(_postProvider(slug));
    return Scaffold(
      appBar: AppBar(title: const Text('Article')),
      body: post.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e'),
        data: (p) {
          final img = mediaUrl(p.cover);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(p.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text('${p.author != null ? "By ${p.author} · " : ""}${timeAgo(p.publishedAt)}', style: const TextStyle(color: Colors.black54)),
              if (img != null) Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: ClipRRect(borderRadius: BorderRadius.circular(12), child: CachedNetworkImage(imageUrl: img))),
              const SizedBox(height: 12),
              HtmlText(p.body ?? ''),
            ],
          );
        },
      ),
    );
  }
}
