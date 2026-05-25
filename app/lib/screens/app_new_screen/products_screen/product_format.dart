import 'package:intl/intl.dart';

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
