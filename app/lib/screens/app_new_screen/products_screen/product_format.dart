import 'package:intl/intl.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/l10n/translations.dart';

final _mnt0 = NumberFormat.decimalPattern('mn_MN');

/// 1 234 567 ₮
String formatMNT(num value) {
  return '${_mnt0.format(value)}₮';
}

/// Fixed conversion — must match backend (see createInstallmentInit.js).
const int kDaysPerMonth = 30;

/// Returns ceil(price / (months * 30)) — matches backend daily math.
int dailyAmount(int price, int months) {
  if (months <= 0) return price;
  return (price / (months * kDaysPerMonth)).ceil();
}

/// Total days for a given month count (= months * 30).
int totalDaysFor(int months) => months * kDaysPerMonth;

/// Жингийн нэгжээр формат: unit 'gr' → "0.1 гр", unit 'lan' → "0.1 лан".
/// Алтан эдлэл граммаар, мөнгөн эдлэл лангаар (1 лан = 37.5 гр) хэмжигдэнэ.
String formatGrams(num grams, [String unit = 'gr']) {
  final r = (grams * 100).round() / 100;
  final str = r == r.roundToDouble()
      ? r.toInt().toString()
      : r.toStringAsFixed(2).replaceFirst(RegExp(r'0$'), '');
  return '$str ${tr(unit == 'lan' ? 'silver.lan_unit' : 'gold.gram_unit')}';
}

/// Жин дээр суурилсан дэлгэцүүдийн текст: [unit] 'lan' (мөнгөн эдлэл) бөгөөд
/// тухайн түлхүүрийн `silver.` хувилбар байвал түүнийг, үгүй бол `gold.`-ыг
/// ашиглана. Ингэснээр алт/мөнгөний дэлгэц нэг кодоор ажиллана.
String wtr(String unit, String goldKey, [Map<String, Object?>? params]) {
  if (unit == 'lan') {
    final k = goldKey.replaceFirst('gold.', 'silver.');
    if (kTranslations.containsKey(k)) return tr(k, params);
  }
  return tr(goldKey, params);
}
