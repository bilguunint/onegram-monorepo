/// Үйлчилгээний нөхцөлийн баримт (Firestore `terms/{key}` эсвэл локал нөөц).
class TermsDoc {
  final String key;
  final Map<String, String> title;
  final Map<String, String> body;
  /// Админ хадгалах бүрд 1-ээр нэмэгдэнэ. Локал нөөц текст 0.
  final int version;
  /// Админ сүүлд хадгалсан огноо (локал нөөцөд null).
  final DateTime? updatedAt;
  /// Firestore-оос ирсэн эсэх (false бол аппын нөөц текст).
  final bool fromServer;

  const TermsDoc({
    required this.key,
    required this.title,
    required this.body,
    required this.version,
    required this.fromServer,
    this.updatedAt,
  });

  factory TermsDoc.fromMap(String key, Map<String, dynamic> map) {
    Map<String, String> strMap(Object? v) {
      if (v is Map) {
        return v.map((k, val) => MapEntry('$k', val == null ? '' : '$val'));
      }
      return const {};
    }

    final ts = map['updated_at'];
    DateTime? updated;
    try {
      // cloud_firestore Timestamp — toDate() байдаг; моделийг Firestore-оос
      // хамааралгүй байлгахын тулд dynamic-аар дуудна.
      updated = (ts as dynamic)?.toDate() as DateTime?;
    } catch (_) {
      updated = null;
    }

    return TermsDoc(
      key: key,
      title: strMap(map['title']),
      body: strMap(map['body']),
      version: (map['version'] as num?)?.toInt() ?? 1,
      updatedAt: updated,
      fromServer: true,
    );
  }

  String titleFor(String lang) => _pick(title, lang);

  String bodyFor(String lang) => _pick(body, lang);

  /// Хүссэн хэл байхгүй бол монгол, тэр ч байхгүй бол аль байгааг нь.
  static String _pick(Map<String, String> m, String lang) {
    final v = m[lang];
    if (v != null && v.trim().isNotEmpty) return v;
    final mn = m['mn'];
    if (mn != null && mn.trim().isNotEmpty) return mn;
    for (final e in m.values) {
      if (e.trim().isNotEmpty) return e;
    }
    return '';
  }
}

/// Хэрэглэгчийн нөхцөл зөвшөөрсөн бүртгэл (`terms_acceptances/{uid}_{key}_v{n}`).
class TermsAcceptance {
  final String termsKey;
  final int version;
  final DateTime? acceptedAt;

  const TermsAcceptance({
    required this.termsKey,
    required this.version,
    required this.acceptedAt,
  });
}
