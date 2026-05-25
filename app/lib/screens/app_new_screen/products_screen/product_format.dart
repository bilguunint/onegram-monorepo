import 'package:intl/intl.dart';

final _mnt0 = NumberFormat.decimalPattern('mn_MN');

/// 1 234 567 ₮
String formatMNT(num value) {
  return '${_mnt0.format(value)}₮';
}

/// Returns ceil(price / months) — matches admin/repository monthly logic.
int monthlyAmount(int price, int months) {
  if (months <= 0) return price;
  return (price / months).ceil();
}
