import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/fallback.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/state_views.dart';

class JobApplication {
  const JobApplication({
    required this.id,
    required this.jobTitle,
    required this.company,
    required this.status,
    required this.appliedDaysAgo,
  });
  final int id;
  final String jobTitle;
  final String company;
  final String status;
  final int appliedDaysAgo;
}

List<JobApplication> _dummyApplications() => const [
      JobApplication(
        id: 1,
        jobTitle: 'Senior Laravel Developer',
        company: 'ClassiAds Tech',
        status: 'pending',
        appliedDaysAgo: 1,
      ),
      JobApplication(
        id: 2,
        jobTitle: 'Mobile Flutter Engineer',
        company: 'BrightStudio',
        status: 'reviewing',
        appliedDaysAgo: 3,
      ),
      JobApplication(
        id: 3,
        jobTitle: 'Customer Support Lead',
        company: 'EduHub India',
        status: 'rejected',
        appliedDaysAgo: 9,
      ),
    ];

final myApplicationsProvider = FutureProvider.autoDispose<List<JobApplication>>(
  (ref) => withFallback(() async {
    final res = await ref.read(apiClientProvider).get('/my/applications');
    return res.list
        .map((e) => JobApplication(
              id: (e['id'] as num).toInt(),
              jobTitle: (e['job']?['title'] as String?) ?? 'Job',
              company: (e['job']?['company_name'] as String?) ?? '',
              status: e['status'] as String? ?? 'submitted',
              appliedDaysAgo: daysSince(e['created_at']),
            ))
        .toList();
  }, _dummyApplications),
);

class JobApplicationsScreen extends ConsumerWidget {
  const JobApplicationsScreen({super.key});

  static const _statusColor = {
    // API statuses: submitted → reviewed → shortlisted → hired | rejected.
    'submitted': Color(0xFFB57F00),
    'pending': Color(0xFFB57F00),
    'reviewed': Color(0xFF272757),
    'reviewing': Color(0xFF272757),
    'shortlisted': Color(0xFF505081),
    'hired': Color(0xFF1F8A6B),
    'accepted': Color(0xFF1F8A6B),
    'rejected': Color(0xFFD64545),
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myApplicationsProvider);
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
          'My Job Applications',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w800,
            fontSize: 19,
          ),
        ),
        centerTitle: true,
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(myApplicationsProvider),
        ),
        data: (list) {
          if (list.isEmpty) return const _NoData();
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final a = list[i];
              final color = _statusColor[a.status] ?? const Color(0xFF8A8A9C);
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.seed.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.work_outline,
                              color: AppTheme.seed, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                a.jobTitle,
                                style: const TextStyle(
                                  color: AppTheme.textDark,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                a.company,
                                style: TextStyle(
                                  color: AppTheme.textDark.withValues(alpha: 0.55),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            a.status,
                            style: TextStyle(
                              fontSize: 11,
                              color: color,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Applied ${a.appliedDaysAgo}d ago',
                      style: TextStyle(
                        color: AppTheme.textDark.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _NoData extends StatelessWidget {
  const _NoData();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Image.asset('assets/emty-data.png', width: 260, height: 260, fit: BoxFit.contain),
          const SizedBox(height: 12),
          const Text(
            'No applications yet',
            style: TextStyle(
              color: AppTheme.seed,
              fontSize: 21,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Browse jobs and apply — you'll see the status of each application here.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.65),
              fontSize: 14,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
