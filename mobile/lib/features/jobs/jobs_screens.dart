import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/fallback.dart';
import '../../shared/widgets/state_views.dart';
import '../../shared/widgets/html_text.dart';
import '../auth/auth_controller.dart';

class Job {
  Job(this.id, this.title, this.slug, this.company, this.city, this.type, this.salary, this.description);
  final int id;
  final String title;
  final String slug;
  final String? company;
  final String? city;
  final String type;
  final String? salary;
  final String description;
  factory Job.fromJson(Map<String, dynamic> j) => Job(
        (j['id'] as num).toInt(),
        j['title'] as String? ?? '',
        j['slug'] as String? ?? '',
        j['company_name'] as String?,
        j['city'] as String?,
        j['employment_type'] as String? ?? 'full_time',
        j['salary_display'] as String?,
        j['description'] as String? ?? '',
      );
}

final _jobsProvider = FutureProvider.autoDispose<List<Job>>((ref) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/jobs');
      return res.list.map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
    },
    () => DummyData.jobs().map((e) => Job.fromJson(e)).toList(),
  );
});

final _jobProvider = FutureProvider.autoDispose.family<Job, String>((ref, slug) {
  return withFallback(
    () async {
      final res = await ref.watch(apiClientProvider).get('/jobs/$slug');
      return Job.fromJson(res.map);
    },
    () => DummyData.jobs().map((e) => Job.fromJson(e)).firstWhere((j) => j.slug == slug, orElse: () => Job.fromJson(DummyData.jobs().first)),
  );
});

class JobsScreen extends ConsumerWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(_jobsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Jobs')),
      body: jobs.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(_jobsProvider)),
        data: (list) {
          if (list.isEmpty) return const EmptyView(message: 'No open jobs', icon: Icons.work_outline);
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final j = list[i];
              return Card(
                child: ListTile(
                  title: Text(j.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${j.company ?? "Company"}${j.city != null ? " · ${j.city}" : ""}${j.salary != null ? " · ${j.salary}" : ""}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/jobs/${j.slug}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class JobDetailScreen extends ConsumerWidget {
  const JobDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final job = ref.watch(_jobProvider(slug));
    return Scaffold(
      appBar: AppBar(title: const Text('Job')),
      body: job.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e'),
        data: (j) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(j.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${j.company ?? "Company"}${j.city != null ? " · ${j.city}" : ""}', style: const TextStyle(color: Colors.black54)),
            if (j.salary != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(j.salary!, style: const TextStyle(color: Color(0xFF272757), fontWeight: FontWeight.bold))),
            const SizedBox(height: 16),
            HtmlText(j.description),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () async {
                if (ref.read(authControllerProvider).status != AuthStatus.authenticated) {
                  context.push('/login?next=${Uri.encodeComponent('/jobs/$slug')}');
                  return;
                }
                final cover = await showDialog<String>(
                  context: context,
                  builder: (ctx) {
                    final c = TextEditingController();
                    return AlertDialog(
                      title: const Text('Apply'),
                      content: TextField(controller: c, maxLines: 4, decoration: const InputDecoration(labelText: 'Cover letter (optional)')),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                        FilledButton(style: FilledButton.styleFrom(minimumSize: const Size(88, 44)), onPressed: () => Navigator.pop(ctx, c.text), child: const Text('Submit')),
                      ],
                    );
                  },
                );
                if (cover == null) return;
                try {
                  await ref.read(apiClientProvider).post('/jobs/${j.id}/apply', body: {'cover_letter': cover});
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Application submitted!')));
                } on ApiException catch (e) {
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                }
              },
              child: const Text('Apply Now'),
            ),
          ],
        ),
      ),
    );
  }
}
