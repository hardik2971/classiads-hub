import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dummy/dummy_data.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/fallback.dart';
import '../../shared/models/ad.dart';
import '../auth/data/user.dart';

class Conversation {
  Conversation({
    required this.id,
    this.role,
    this.unreadCount = 0,
    this.lastMessage,
    this.lastMessageAt,
    this.counterpart,
    this.ad,
  });

  final int id;
  final String? role;
  final int unreadCount;
  final String? lastMessage;
  final String? lastMessageAt;
  final User? counterpart;
  final Ad? ad;

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: (j['id'] as num).toInt(),
        role: j['role'] as String?,
        unreadCount: (j['unread_count'] as num?)?.toInt() ?? 0,
        lastMessage: j['last_message'] as String?,
        lastMessageAt: j['last_message_at'] as String?,
        counterpart: j['counterpart'] is Map ? User.fromJson(j['counterpart'] as Map<String, dynamic>) : null,
        ad: j['ad'] is Map ? Ad.fromJson(j['ad'] as Map<String, dynamic>) : null,
      );
}

class Message {
  Message({
    required this.id,
    required this.isMine,
    this.type = 'text',
    this.body,
    this.createdAt,
    this.offerId,
    this.offerStatus,
  });
  final int id;
  final bool isMine;
  final String type;
  final String? body;
  final String? createdAt;

  /// Set on `offer` messages: the offer this message carries and its live status.
  final int? offerId;
  final String? offerStatus;

  factory Message.fromJson(Map<String, dynamic> j) => Message(
        id: (j['id'] as num).toInt(),
        isMine: j['is_mine'] == true,
        type: j['type'] as String? ?? 'text',
        body: j['body'] as String?,
        createdAt: j['created_at'] as String?,
        offerId: ((j['offer'] as Map?)?['id'] as num?)?.toInt(),
        offerStatus: (j['offer'] as Map?)?['status'] as String?,
      );
}

class ChatRepository {
  ChatRepository(this._api);
  final ApiClient _api;

  /// [tab] = null | 'selling' | 'buying'. The API filters server-side.
  Future<List<Conversation>> conversations({String? tab}) => withFallback(() async {
        final res = await _api.get(
          '/conversations',
          query: tab == null ? null : {'tab': tab},
        );
        return res.list.map((e) => Conversation.fromJson(e as Map<String, dynamic>)).toList();
      }, DummyData.conversations);

  /// Returns (conversation, messages oldest→newest).
  Future<(Conversation, List<Message>)> conversation(int id) => withFallback(() async {
        final res = await _api.get('/conversations/$id');
        final conv = Conversation.fromJson(res.map['conversation'] as Map<String, dynamic>);
        final rawMsgs = res.map['messages'];
        final msgsRaw = rawMsgs is Map ? (rawMsgs['data'] as List? ?? const []) : (rawMsgs as List? ?? const []);
        final msgs = msgsRaw.map((e) => Message.fromJson(e as Map<String, dynamic>)).toList().reversed.toList();
        return (conv, msgs);
      }, () => (DummyData.conversations().firstWhere((c) => c.id == id, orElse: () => DummyData.conversations().first), DummyData.messages()));

  /// Seller response to a pending offer: [action] = 'accept' | 'reject'.
  Future<void> respondToOffer(int offerId, String action) =>
      _api.post('/offers/$offerId/$action');

  Future<Message> send(int id, String body) async {
    final res = await _api.post('/conversations/$id/messages', body: {'body': body});
    return Message.fromJson(res.map);
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) => ChatRepository(ref.watch(apiClientProvider)));

final conversationsProvider = FutureProvider.autoDispose<List<Conversation>>(
  (ref) => ref.watch(chatRepositoryProvider).conversations(),
);

/// Conversations filtered by tab — used by the Selling / Buying tabs.
final conversationsByTabProvider =
    FutureProvider.autoDispose.family<List<Conversation>, String>(
  (ref, tab) => ref.watch(chatRepositoryProvider).conversations(tab: tab),
);
