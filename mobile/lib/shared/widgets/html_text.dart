import 'package:flutter/material.dart';

/// Minimal renderer for the simple HTML the CMS emits (pages, blog posts, job
/// descriptions): headings, paragraphs, lists, line breaks and bold/italic runs.
/// Anything else is stripped to its text. Plain text renders unchanged.
class HtmlText extends StatelessWidget {
  const HtmlText(this.html, {super.key, this.style});
  final String html;
  final TextStyle? style;

  static final _blockSplit = RegExp(
    r'(<h[1-6][^>]*>.*?</h[1-6]>|<li[^>]*>.*?</li>|<p[^>]*>.*?</p>|<br\s*/?>|</?(?:ul|ol|div|section|blockquote)[^>]*>)',
    caseSensitive: false,
    dotAll: true,
  );

  @override
  Widget build(BuildContext context) {
    final base = style ?? DefaultTextStyle.of(context).style.copyWith(height: 1.5, fontSize: 15);
    if (!html.contains('<')) return Text(_decode(html), style: base);

    final blocks = <Widget>[];
    var cursor = 0;
    void addLoose(String s) {
      final t = _decode(_strip(s)).trim();
      if (t.isNotEmpty) blocks.add(_para(_inline(s.trim(), base)));
    }

    for (final m in _blockSplit.allMatches(html)) {
      addLoose(html.substring(cursor, m.start));
      cursor = m.end;
      final tag = m.group(0)!;
      final lower = tag.toLowerCase();
      final heading = RegExp(r'^<h([1-6])', caseSensitive: false).firstMatch(lower);
      if (heading != null) {
        final level = int.parse(heading.group(1)!);
        final size = (base.fontSize ?? 15) + (level <= 2 ? 5 : 2);
        blocks.add(Padding(
          padding: const EdgeInsets.only(top: 14, bottom: 6),
          child: Text.rich(
            _inline(_inner(tag), base.copyWith(fontSize: size, fontWeight: FontWeight.w800)),
          ),
        ));
      } else if (lower.startsWith('<li')) {
        blocks.add(Padding(
          padding: const EdgeInsets.only(left: 6, bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('•  ', style: base),
              Expanded(child: Text.rich(_inline(_inner(tag), base))),
            ],
          ),
        ));
      } else if (lower.startsWith('<p')) {
        final inner = _inner(tag);
        if (_decode(_strip(inner)).trim().isNotEmpty) blocks.add(_para(_inline(inner, base)));
      }
      // <br>, list/div wrappers: structural only.
    }
    addLoose(html.substring(cursor));

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: blocks);
  }

  Widget _para(InlineSpan span) =>
      Padding(padding: const EdgeInsets.only(bottom: 10), child: Text.rich(span));

  static String _inner(String tag) =>
      tag.replaceFirst(RegExp(r'^<[^>]+>'), '').replaceFirst(RegExp(r'</[^>]+>$'), '');

  /// Bold/italic runs inside a block.
  static InlineSpan _inline(String s, TextStyle base) {
    final spans = <InlineSpan>[];
    final re = RegExp(r'<(strong|b|em|i)\b[^>]*>(.*?)</\1>', caseSensitive: false, dotAll: true);
    var i = 0;
    for (final m in re.allMatches(s)) {
      if (m.start > i) spans.add(TextSpan(text: _decode(_strip(s.substring(i, m.start)))));
      final t = m.group(1)!.toLowerCase();
      final bold = t == 'strong' || t == 'b';
      spans.add(TextSpan(
        text: _decode(_strip(m.group(2)!)),
        style: bold ? const TextStyle(fontWeight: FontWeight.w700) : const TextStyle(fontStyle: FontStyle.italic),
      ));
      i = m.end;
    }
    if (i < s.length) spans.add(TextSpan(text: _decode(_strip(s.substring(i)))));
    return TextSpan(style: base, children: spans);
  }

  static String _strip(String s) => s.replaceAll(RegExp(r'<[^>]*>'), '').replaceAll(RegExp(r'\s+'), ' ');

  static String _decode(String s) => s
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&rsquo;', '’')
      .replaceAll('&lsquo;', '‘')
      .replaceAll('&rdquo;', '”')
      .replaceAll('&ldquo;', '“')
      .replaceAll('&mdash;', '—')
      .replaceAll('&ndash;', '–')
      .replaceAll('&hellip;', '…')
      .replaceAllMapped(RegExp(r'&#(\d+);'), (m) => String.fromCharCode(int.parse(m.group(1)!)));
}
