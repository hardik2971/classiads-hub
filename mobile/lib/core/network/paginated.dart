/// A page of results parsed from the API envelope's `data` + `meta.pagination`.
class Paginated<T> {
  Paginated({
    required this.items,
    required this.currentPage,
    required this.lastPage,
    required this.total,
  });

  final List<T> items;
  final int currentPage;
  final int lastPage;
  final int total;

  bool get hasMore => currentPage < lastPage;

  static Paginated<T> fromEnvelope<T>(
    List<dynamic> data,
    Map<String, dynamic>? meta,
    T Function(Map<String, dynamic>) parse,
  ) {
    final p = (meta?['pagination'] as Map<String, dynamic>?) ?? const {};
    return Paginated<T>(
      items: data
          .whereType<Map<String, dynamic>>()
          .map(parse)
          .toList(growable: false),
      currentPage: (p['current_page'] as num?)?.toInt() ?? 1,
      lastPage: (p['last_page'] as num?)?.toInt() ?? 1,
      total: (p['total'] as num?)?.toInt() ?? data.length,
    );
  }
}
