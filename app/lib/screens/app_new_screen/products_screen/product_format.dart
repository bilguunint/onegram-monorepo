import 'package:intl/intl.dart';
import 'package:onegrgold/l10n/app_locale.dart';

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

/// 0.1 → "0.1 гр", 5.25 → "5.25 гр", 2.0 → "2 гр".
String formatGrams(num grams) {
  final r = (grams * 100).round() / 100;
  final str = r == r.roundToDouble()
      ? r.toInt().toString()
      : r.toStringAsFixed(2).replaceFirst(RegExp(r'0$'), '');
  return '$str ${tr('gold.gram_unit')}';
}
