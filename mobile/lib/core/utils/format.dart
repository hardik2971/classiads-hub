/// Media URLs are absolute Firebase Storage URLs; normalises empty values to null.
String? mediaUrl(String? url) {
  if (url == null || url.isEmpty) return null;
  return url;
}

String timeAgo(String? iso) {
  if (iso == null) return '';
  final d = DateTime.tryParse(iso);
  if (d == null) return '';
  final s = DateTime.now().difference(d).inSeconds;
  if (s < 60) return 'just now';
  final m = s ~/ 60;
  if (m < 60) return '${m}m ago';
  final h = m ~/ 60;
  if (h < 24) return '${h}h ago';
  final days = h ~/ 24;
  if (days < 30) return '${days}d ago';
  return '${d.day}/${d.month}/${d.year}';
}

/// Whole days since an ISO timestamp (0 when missing/unparseable).
int daysSince(Object? iso) {
  final d = iso is String ? DateTime.tryParse(iso) : null;
  if (d == null) return 0;
  final days = DateTime.now().difference(d).inDays;
  return days < 0 ? 0 : days;
}
