import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/state_views.dart';
import '../chat_repository.dart';

class ChatListScreen extends ConsumerStatefulWidget {
  const ChatListScreen({super.key});

  @override
  ConsumerState<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends ConsumerState<ChatListScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this)..addListener(() {
        // Repaint the search-bar / list when the active tab changes.
        if (mounted) setState(() {});
      });
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Chats',
          style: TextStyle(
            color: AppTheme.textDark,
            fontWeight: FontWeight.w800,
            fontSize: 22,
            letterSpacing: -0.3,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tab,
              labelColor: AppTheme.seed,
              unselectedLabelColor: AppTheme.textDark.withValues(alpha: 0.55),
              indicatorColor: AppTheme.seed,
              indicatorWeight: 3,
              labelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              unselectedLabelStyle:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              tabs: const [
                Tab(text: 'Selling'),
                Tab(text: 'Buying'),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          _SearchBar(onChanged: (v) => setState(() => _query = v)),
          Expanded(
            child: TabBarView(
              controller: _tab,
              children: const [
                _ChatList(tab: 'selling'),
                _ChatList(tab: 'buying'),
              ].map((w) => _withSearch(w)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  // Wraps each tab body in a builder that injects the current search query.
  Widget _withSearch(Widget child) {
    if (child is _ChatList) {
      return _ChatList(tab: child.tab, query: _query);
    }
    return child;
  }
}

// ─────────────────────────────── Search ────────────────────────────────────

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onChanged});
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            const Icon(Icons.search, color: AppTheme.seed, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                onChanged: onChanged,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  isCollapsed: true,
                  hintText: 'Search',
                  hintStyle: TextStyle(color: Color(0xFFA0A0B0), fontSize: 16),
                ),
                style: const TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────── Chat list ─────────────────────────────────

class _ChatList extends ConsumerWidget {
  const _ChatList({required this.tab, this.query = ''});
  final String tab;
  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(conversationsByTabProvider(tab));
    return async.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(
        message: '$e',
        onRetry: () => ref.invalidate(conversationsByTabProvider(tab)),
      ),
      data: (list) {
        final q = query.trim().toLowerCase();
        final filtered = q.isEmpty
            ? list
            : list.where((c) {
                final name = (c.counterpart?.name ?? '').toLowerCase();
                final adTitle = (c.ad?.title ?? '').toLowerCase();
                final last = (c.lastMessage ?? '').toLowerCase();
                return name.contains(q) || adTitle.contains(q) || last.contains(q);
              }).toList();
        if (filtered.isEmpty) return const _EmptyState();
        return RefreshIndicator(
          onRefresh: () async => ref.refresh(conversationsByTabProvider(tab).future),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _ConversationCard(c: filtered[i]),
          ),
        );
      },
    );
  }
}

// ──────────────────────────── Conversation card ───────────────────────────

class _ConversationCard extends StatelessWidget {
  const _ConversationCard({required this.c});
  final Conversation c;

  @override
  Widget build(BuildContext context) {
    final adImageUrl = mediaUrl(c.ad?.primaryImage);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push('/conversations/${c.id}'),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
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
          child: Row(
            children: [
              // Ad image with counterpart-indicator dot
              SizedBox(
                width: 52,
                height: 52,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundLight,
                        shape: BoxShape.circle,
                        image: adImageUrl != null
                            ? DecorationImage(
                                image: CachedNetworkImageProvider(adImageUrl),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: adImageUrl == null
                          ? const Icon(Icons.image_outlined,
                              color: AppTheme.seed, size: 22)
                          : null,
                    ),
                    Positioned(
                      right: -2,
                      bottom: -2,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: AppTheme.seed,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.person, color: Colors.white, size: 12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              // Title (ad) + subtitle (counterpart)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      c.ad?.title ?? (c.counterpart?.name ?? 'Conversation'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textDark,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      // "Name · last message" (ad-less chats already show the name as title).
                      [
                        if (c.ad != null) c.counterpart?.name,
                        c.lastMessage,
                      ].whereType<String>().where((e) => e.isNotEmpty).join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppTheme.textDark.withValues(alpha: 0.55),
                        fontSize: 13.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Time + optional unread badge
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    timeAgo(c.lastMessageAt),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textDark.withValues(alpha: 0.5),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (c.unreadCount > 0) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                      decoration: const BoxDecoration(
                        color: AppTheme.seed,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${c.unreadCount}',
                        style: const TextStyle(color: Colors.white, fontSize: 11),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────── Empty state ───────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(28, 28, 28, 28),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Image.asset(
            'assets/emty-data.png',
            width: 280,
            height: 280,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 18),
          const Text(
            'No Data Found',
            style: TextStyle(
              color: AppTheme.seed,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            "Sorry, we couldn't find what you were looking for.\nPlease try another search.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.7),
              fontSize: 15,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
