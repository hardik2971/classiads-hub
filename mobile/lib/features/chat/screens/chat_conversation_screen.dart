import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/state_views.dart';
import '../chat_repository.dart';

class ChatConversationScreen extends ConsumerStatefulWidget {
  const ChatConversationScreen({super.key, required this.id});
  final int id;

  @override
  ConsumerState<ChatConversationScreen> createState() => _ChatConversationScreenState();
}

class _ChatConversationScreenState extends ConsumerState<ChatConversationScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  Conversation? _conv;
  List<Message> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load();
    // No realtime channel yet — poll so replies from the other side show up.
    _poll = Timer.periodic(const Duration(seconds: 8), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final (conv, msgs) = await ref.read(chatRepositoryProvider).conversation(widget.id);
      if (mounted) {
        setState(() {
          _conv = conv;
          _messages = msgs;
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) setState(() { _error = '$e'; _loading = false; });
    }
  }

  /// Quiet reload; only scrolls when new messages arrived.
  Future<void> _refresh() async {
    if (_loading || _sending || !mounted) return;
    try {
      final (conv, msgs) = await ref.read(chatRepositoryProvider).conversation(widget.id);
      if (!mounted) return;
      final grew = msgs.length != _messages.length;
      final changed = grew ||
          List.generate(msgs.length, (i) => msgs[i].offerStatus != _messages[i].offerStatus).any((x) => x);
      if (!changed) return;
      setState(() {
        _conv = conv;
        _messages = msgs;
      });
      if (grew) _scrollToBottom();
    } catch (_) {/* keep what we have */}
  }

  Future<void> _respond(Message m, String action) async {
    try {
      await ref.read(chatRepositoryProvider).respondToOffer(m.offerId!, action);
      await _refresh();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
    });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      final msg = await ref.read(chatRepositoryProvider).send(widget.id, text);
      if (!mounted) return;
      setState(() { _messages = [..._messages, msg]; _input.clear(); });
      _scrollToBottom();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ad = _conv?.ad;
    final adImg = mediaUrl(ad?.primaryImage);
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
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: AppTheme.seed,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _conv?.counterpart?.name ?? 'Chat',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        actions: [
          if (ad != null)
            IconButton(
              tooltip: 'View ad',
              icon: const Icon(Icons.open_in_new, color: AppTheme.textDark),
              onPressed: () => context.push('/ad/${ad.slug}'),
            ),
        ],
        bottom: ad == null
            ? null
            : PreferredSize(
                preferredSize: const Size.fromHeight(74),
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: AppTheme.backgroundLight,
                          borderRadius: BorderRadius.circular(25),
                          image: adImg != null
                              ? DecorationImage(
                                  image: CachedNetworkImageProvider(adImg),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          ad.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppTheme.textDark,
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ad.priceDisplay ?? '',
                        style: const TextStyle(
                          color: AppTheme.seed,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _messages.isEmpty
                        ? const _EmptyConversation()
                        : _MessageList(messages: _messages, controller: _scroll, onRespond: _respond),
          ),
          _MessageInput(
            controller: _input,
            sending: _sending,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────── Message list ──────────────────────────────

class _MessageList extends StatelessWidget {
  const _MessageList({required this.messages, required this.controller, required this.onRespond});
  final List<Message> messages;
  final ScrollController controller;
  final void Function(Message m, String action) onRespond;

  // Returns the date label for index [i], or null if it matches the previous one.
  String? _dateLabel(int i) {
    final m = messages[i];
    if (m.createdAt == null) return null;
    final cur = DateTime.tryParse(m.createdAt!);
    if (cur == null) return null;
    if (i == 0) return DateFormat('MMMM d, y').format(cur);
    final prev = DateTime.tryParse(messages[i - 1].createdAt ?? '');
    if (prev == null) return DateFormat('MMMM d, y').format(cur);
    if (prev.year == cur.year && prev.month == cur.month && prev.day == cur.day) {
      return null;
    }
    return DateFormat('MMMM d, y').format(cur);
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      itemCount: messages.length,
      itemBuilder: (_, i) {
        final m = messages[i];
        final dateLabel = _dateLabel(i);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (dateLabel != null) _DatePill(label: dateLabel),
            _Bubble(m: m, onRespond: (action) => onRespond(m, action)),
          ],
        );
      },
    );
  }
}

class _DatePill extends StatelessWidget {
  const _DatePill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 14),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 7),
        decoration: BoxDecoration(
          color: AppTheme.seed,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.m, required this.onRespond});
  final Message m;
  final ValueChanged<String> onRespond;

  String _timeOnly(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso);
    return d == null ? '' : DateFormat('h:mm a').format(d.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    // Offer or system message → centered "card" with cyan border.
    if (m.type == 'offer' || m.type == 'system') {
      return Align(
        alignment: m.isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.seed.withValues(alpha: 0.06),
            border: Border.all(color: AppTheme.seed.withValues(alpha: 0.35)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                m.type == 'system' ? 'Offer update' : (m.isMine ? 'Your Offer' : 'Offer'),
                style: const TextStyle(
                  color: AppTheme.seed,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                m.body ?? '',
                style: const TextStyle(
                  color: AppTheme.seed,
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (m.type == 'offer' && m.offerStatus != null && m.offerStatus != 'pending') ...[
                const SizedBox(height: 4),
                Text(
                  m.offerStatus![0].toUpperCase() + m.offerStatus!.substring(1),
                  style: TextStyle(color: AppTheme.textDark.withValues(alpha: 0.6), fontSize: 12.5),
                ),
              ],
              // Seller side of a pending offer: accept / reject inline.
              if (m.type == 'offer' && !m.isMine && m.offerId != null && m.offerStatus == 'pending') ...[
                const SizedBox(height: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton(
                      onPressed: () => onRespond('reject'),
                      style: TextButton.styleFrom(foregroundColor: const Color(0xFFD64545)),
                      child: const Text('Reject'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () => onRespond('accept'),
                      style: FilledButton.styleFrom(minimumSize: const Size(88, 38)),
                      child: const Text('Accept'),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment:
            m.isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.72,
            ),
            decoration: BoxDecoration(
              color: m.isMine
                  ? Colors.black.withValues(alpha: 0.08)
                  : Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(m.isMine ? 16 : 4),
                bottomRight: Radius.circular(m.isMine ? 4 : 16),
              ),
            ),
            child: Text(
              m.body ?? '',
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 15.5,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _timeOnly(m.createdAt),
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.5),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────── Empty / input ─────────────────────────────

class _EmptyConversation extends StatelessWidget {
  const _EmptyConversation();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          'Say hello 👋',
          style: TextStyle(
            color: AppTheme.textDark.withValues(alpha: 0.55),
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}

class _MessageInput extends StatelessWidget {
  const _MessageInput({
    required this.controller,
    required this.sending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        color: AppTheme.backgroundLight,
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 50,
                padding: const EdgeInsets.only(left: 18, right: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: controller,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => onSend(),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          isCollapsed: true,
                          hintText: 'Message',
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
            ),
            const SizedBox(width: 10),
            Material(
              color: AppTheme.seed,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: sending ? null : onSend,
                child: SizedBox(
                  width: 50,
                  height: 50,
                  child: sending
                      ? const Padding(
                          padding: EdgeInsets.all(14),
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4, color: Colors.white,
                          ),
                        )
                      : Icon(
                          controller.text.trim().isEmpty
                              ? Icons.mic
                              : Icons.send,
                          color: Colors.white,
                          size: 22,
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
