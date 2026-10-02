// Аппын l10n дахь үйлчилгээний нөхцөлийн текстийг JSON болгон хэвлэнэ.
// Firestore-д анх удаа seed хийхэд ашиглана (functions/scripts/seed_terms.js).
//
//   cd app && dart run tool/export_terms.dart > /tmp/terms_seed.json
import 'dart:convert';
import 'dart:io';

import 'package:onegrgold/l10n/terms_fallback.dart';

void main() {
  final out = <String, Map<String, Object>>{};
  for (final key in kTermsKeys) {
    final title = <String, String>{};
    final body = <String, String>{};
    for (final lang in kTermsLanguages) {
      title[lang] = localTermsTitle(key, lang);
      body[lang] = localTermsBody(key, lang);
    }
    out[key] = {'key': key, 'title': title, 'body': body};
  }
  stdout.writeln(const JsonEncoder.withIndent('  ').convert(out));
}
