import 'translations.dart';

/// Үйлчилгээний нөхцөлийн ТҮҮВЭР (fallback) текст.
///
/// Нөхцөлийн эх хувилбар Firestore `terms/{key}` баримтад байх бөгөөд
/// админаас засварлагдана. Энэ файл нь:
///   1. Firestore хүрэх боломжгүй (офлайн, баримт үүсээгүй) үед аппд харуулах
///      нөөц текст;
///   2. `tool/export_terms.dart`-ын эх сурвалж (Firestore-д анх удаа seed хийх).
///
/// Зөвхөн `translations.dart`-аас хамаарна (Flutter импортгүй) тул энгийн
/// `dart run`-аар ажиллуулж болно.
///
/// Текстийн формат (апп ба админы preview ижил дүрмээр уншина):
///   `# Гарчиг`   — бүлгийн гарчиг
///   `- мөр`      — цэгтэй мөр
///   хоосон мөр   — зай
///   бусад мөр    — энгийн догол мөр
///   `{percent}` гэх мэт хаалттай нэр — апп дээр утгаар солигдоно.

/// Firestore-д хадгалагдах нөхцөлийн түлхүүрүүд.
const List<String> kTermsKeys = [
  'general',
  'privacy',
  'gift',
  'withdraw',
  'installment',
  'refund',
  'shuteen',
];

const List<String> kTermsLanguages = ['mn', 'en', 'zh', 'ru'];

String _t(String key, String lang) {
  final entry = kTranslations[key];
  if (entry == null) return key;
  return entry[lang] ?? entry['mn'] ?? key;
}

/// Бүлэг: гарчгийн түлхүүр + цэгтэй мөрүүдийн түлхүүрүүд.
class _Section {
  final String titleKey;
  final List<String> itemKeys;
  const _Section(this.titleKey, this.itemKeys);
}

String _sections(List<_Section> sections, String lang) {
  final buf = StringBuffer();
  for (final s in sections) {
    buf.writeln('# ${_t(s.titleKey, lang)}');
    for (final k in s.itemKeys) {
      buf.writeln('- ${_t(k, lang)}');
    }
    buf.writeln();
  }
  return buf.toString().trimRight();
}

const _generalSections = [
  _Section('order.terms_s1_title',
      ['order.terms_1_1', 'order.terms_1_2', 'order.terms_1_3']),
  _Section('order.terms_s2_title',
      ['order.terms_2_1', 'order.terms_2_2', 'order.terms_2_3']),
  _Section('order.terms_s3_title',
      ['order.terms_3_1', 'order.terms_3_2', 'order.terms_3_3']),
  _Section('order.terms_s4_title',
      ['order.terms_4_1', 'order.terms_4_2', 'order.terms_4_3']),
  _Section('order.terms_s5_company_title',
      ['order.terms_5_1', 'order.terms_5_2']),
  _Section('order.terms_s6_title', ['order.terms_6_1', 'order.terms_6_2']),
];

const _giftSections = [
  _Section('order.gift_terms_s1_title',
      ['order.gift_terms_1_1', 'order.gift_terms_1_2']),
  _Section('order.gift_terms_s2_title',
      ['order.gift_terms_2_1', 'order.gift_terms_2_2', 'order.gift_terms_2_3']),
  _Section('order.gift_terms_s3_title',
      ['order.gift_terms_3_1', 'order.gift_terms_3_2', 'order.gift_terms_3_3']),
  _Section('order.terms_s4_company_title',
      ['order.gift_terms_4_1', 'order.gift_terms_4_2']),
];

const _withdrawSections = [
  _Section('order.terms_s1_title',
      ['order.withdraw_terms_1_1', 'order.withdraw_terms_1_2']),
  _Section('order.withdraw_terms_s2_title', [
    'order.withdraw_terms_2_1',
    'order.withdraw_terms_2_2',
    'order.withdraw_terms_2_3'
  ]),
  _Section('order.withdraw_terms_s3_title', [
    'order.withdraw_terms_3_1',
    'order.withdraw_terms_3_2',
    'order.withdraw_terms_3_3',
    'order.withdraw_terms_3_4',
    'order.withdraw_terms_3_5'
  ]),
  _Section('order.terms_s4_company_title', [
    'order.withdraw_terms_4_1',
    'order.withdraw_terms_4_2',
    'order.withdraw_terms_4_3'
  ]),
];

/// Хуваан төлөх нөхцөл нэг урт текст тул "1. ТОМ ҮСЭГТЭЙ ГАРЧИГ" хэлбэрийн
/// мөрийг бүлгийн гарчиг болгоно.
String _plainWithHeadings(String text) {
  final heading = RegExp(r'^\d+\.\s+[^a-zа-яөүё]+$');
  final lines = text.trim().split('\n');
  // Эхний мөр нь том үсгээр бичсэн гарчиг (тусдаа title болгож харуулна).
  if (lines.isNotEmpty &&
      lines.first.trim().isNotEmpty &&
      lines.first.trim() == lines.first.trim().toUpperCase()) {
    lines.removeAt(0);
  }
  return lines
      .map((line) {
        final l = line.trimRight();
        if (l.isNotEmpty && heading.hasMatch(l)) return '# $l';
        return l;
      })
      .join('\n');
}

String _shuteenBody(String lang) {
  final buf = StringBuffer();
  buf.writeln(_t('shuteen.section_principles', lang));
  buf.writeln();
  for (var i = 1; i <= 7; i++) {
    buf.writeln('# $i. ${_t('shuteen.p${i}_title', lang)}');
    buf.writeln(_t('shuteen.p${i}_body', lang));
    buf.writeln();
  }
  buf.writeln(_t('shuteen.tax_note', lang));
  return buf.toString().trimRight();
}

const Map<String, String> _installmentTitle = {
  'mn': 'Хуваан төлөх үйлчилгээний нөхцөл',
  'en': 'Instalment service terms',
  'zh': '分期付款服务条款',
  'ru': 'Условия услуги рассрочки',
};

const Map<String, String> _shuteenTitle = {
  'mn': 'Шүтээн хуур хөтөлбөрийн нөхцөл',
  'en': 'Shuteen Khuur program terms',
  'zh': 'Shuteen Khuur 项目条款',
  'ru': 'Условия программы Shuteen Khuur',
};

/// Тухайн түлхүүрийн гарчгийг хэлээр.
String localTermsTitle(String key, String lang) {
  switch (key) {
    case 'general':
      return _t('order.terms_title', lang);
    case 'privacy':
      return _t('reg.help_privacy_policy', lang);
    case 'gift':
      return _t('order.gift_terms_title', lang);
    case 'withdraw':
      return _t('order.withdraw_terms_title', lang);
    case 'installment':
      return _installmentTitle[lang] ?? _installmentTitle['mn']!;
    case 'refund':
      return _t('product.refund_terms_title', lang);
    case 'shuteen':
      return _shuteenTitle[lang] ?? _shuteenTitle['mn']!;
  }
  return key;
}

/// Тухайн түлхүүрийн нөхцөлийн текстийг хэлээр (дээрх форматаар).
String localTermsBody(String key, String lang) {
  switch (key) {
    case 'general':
    case 'privacy':
      return _sections(_generalSections, lang);
    case 'gift':
      return _sections(_giftSections, lang);
    case 'withdraw':
      return _sections(_withdrawSections, lang);
    case 'installment':
      return _plainWithHeadings(_t('purchase.terms_text', lang));
    case 'refund':
      return _t('product.refund_terms', lang).trim();
    case 'shuteen':
      return _shuteenBody(lang);
  }
  return '';
}
