import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/terms_model.dart';
import 'package:onegrgold/repositories/terms_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Firestore `terms/{key}`-ийн нөхцөлийг одоогийн хэлээр харуулна.
///
/// Текстийн формат (terms_fallback.dart-ын тайлбарыг үзнэ):
/// `# ` бүлгийн гарчиг, `- ` цэгтэй мөр, хоосон мөр зай, бусад нь догол мөр.
/// `{name}` хаалттай нэрийг [params]-аас сольж тавина.
///
/// [compact] — жижиг гүйлгэдэг хайрцагт (хуваан төлөлт, буцаалт) caption
/// хэмжээтэй харуулна; үгүй бол бүтэн дэлгэцийн гэрээний хэв маягтай.
class TermsContent extends StatelessWidget {
  final String termsKey;
  final Map<String, Object?>? params;
  final bool showTitle;
  final bool compact;

  const TermsContent({
    super.key,
    required this.termsKey,
    this.params,
    this.showTitle = true,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final repo = TermsRepository.instance;
    return FutureBuilder<TermsDoc>(
      future: repo.load(termsKey),
      initialData: repo.cached(termsKey) ?? repo.fallback(termsKey),
      builder: (context, snap) {
        final doc = snap.data ?? repo.fallback(termsKey);
        return _TermsBody(
          doc: doc,
          params: params,
          showTitle: showTitle,
          compact: compact,
        );
      },
    );
  }
}

class _TermsBody extends StatelessWidget {
  final TermsDoc doc;
  final Map<String, Object?>? params;
  final bool showTitle;
  final bool compact;

  const _TermsBody({
    required this.doc,
    required this.params,
    required this.showTitle,
    required this.compact,
  });

  String _subst(String text) {
    final p = params;
    if (p == null || p.isEmpty) return text;
    return text.replaceAllMapped(RegExp(r'\{(\w+)\}'), (m) {
      final name = m.group(1);
      if (p.containsKey(name)) return '${p[name] ?? ''}';
      return m.group(0)!;
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLocale.current.code;
    final title = _subst(doc.titleFor(lang));
    final lines = _subst(doc.bodyFor(lang)).split('\n');

    final bodyStyle = compact
        ? AppText.caption.copyWith(height: 1.5, color: Colors.white.withValues(alpha: 0.78))
        : AppText.body.copyWith(height: 1.5, color: Colors.white.withValues(alpha: 0.85));
    final headingStyle = compact
        ? AppText.caption.copyWith(
            fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.92))
        : AppText.sectionTitle;
    final titleStyle = compact
        ? AppText.bodyBold
        : AppText.sectionTitle.copyWith(fontSize: 18.0);

    final children = <Widget>[];
    if (showTitle && title.isNotEmpty) {
      children.add(Padding(
        padding: EdgeInsets.only(bottom: compact ? 6.0 : 4.0),
        child: Text(title, style: titleStyle),
      ));
    }

    for (final raw in lines) {
      final line = raw.trimRight();
      if (line.trim().isEmpty) {
        children.add(SizedBox(height: compact ? 4.0 : 6.0));
      } else if (line.startsWith('# ')) {
        children.add(Padding(
          padding: EdgeInsets.only(
              top: compact ? 8.0 : 14.0, bottom: compact ? 4.0 : 8.0),
          child: Text(line.substring(2).trim(), style: headingStyle),
        ));
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        children.add(Padding(
          padding: EdgeInsets.only(left: compact ? 2.0 : 4.0, bottom: compact ? 4.0 : 6.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('•  ', style: bodyStyle.copyWith(color: CustomColors.accent)),
              Expanded(child: Text(line.substring(2).trim(), style: bodyStyle)),
            ],
          ),
        ));
      } else {
        children.add(Padding(
          padding: EdgeInsets.only(bottom: compact ? 4.0 : 8.0),
          child: Text(line, style: bodyStyle),
        ));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }
}
