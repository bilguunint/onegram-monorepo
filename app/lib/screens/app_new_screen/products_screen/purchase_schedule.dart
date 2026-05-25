import 'package:onegrgold/models/product_purchase_model.dart';

/// One row in a purchase's payment history.
///
/// Unlike the old monthly model, we no longer render a row for every
/// scheduled future payment (with 180+ daily installments that would
/// overwhelm the UI). Instead we materialise rows only for *paid* days
/// from the `payments[]` array — the upcoming amount is shown separately
/// as a single "Дараагийн төлбөр" CTA.
class ScheduleRow {
  /// 1-based day index.
  final int dayNo;

  /// When this day was actually paid.
  final DateTime paidAt;

  /// Amount paid for this day.
  final int amount;

  const ScheduleRow({
    required this.dayNo,
    required this.paidAt,
    required this.amount,
  });
}

/// Build the list of paid-day history rows for a purchase, newest first.
/// For [PurchaseType.direct] purchases this returns a single row covering
/// the full payment.
List<ScheduleRow> buildPaymentHistory(ProductPurchase p) {
  final start = p.startedAt ?? DateTime.now();

  if (p.purchaseType == PurchaseType.direct) {
    final rec = p.payments.isNotEmpty ? p.payments.first : null;
    return [
      ScheduleRow(
        dayNo: 1,
        paidAt: rec?.paidAt ?? start,
        amount: p.totalPrice,
      ),
    ];
  }

  final rows = p.payments
      .where((r) => r.paidAt != null)
      .map((r) => ScheduleRow(
            dayNo: r.dayNo,
            paidAt: r.paidAt!,
            amount: r.amount,
          ))
      .toList()
    ..sort((a, b) => b.paidAt.compareTo(a.paidAt));
  return rows;
}
