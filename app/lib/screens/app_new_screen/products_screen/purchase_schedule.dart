import 'package:onegrgold/models/product_purchase_model.dart';

/// One row in a purchase's payment schedule.
class ScheduleRow {
  /// 1-based month index.
  final int monthNo;

  /// When this month's payment should be (or was) made.
  final DateTime dueDate;

  /// Monthly amount to be paid (or actually paid if [isPaid]).
  final int amount;

  /// Whether the user has paid for this month.
  final bool isPaid;

  /// When this month was actually paid (taken from the `payments[]` array
  /// if available). Null for unpaid months.
  final DateTime? paidAt;

  /// Whether the due date has passed AND the row is still unpaid.
  final bool isOverdue;

  const ScheduleRow({
    required this.monthNo,
    required this.dueDate,
    required this.amount,
    required this.isPaid,
    required this.paidAt,
    required this.isOverdue,
  });
}

/// Compute the schedule for an installment purchase. For direct purchases this
/// returns a single row dated to the purchase start.
List<ScheduleRow> buildSchedule(ProductPurchase p) {
  final start = p.startedAt ?? DateTime.now();
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  // Lookup map of explicit payment records for richer paid_at data.
  final payments = <int, PaymentRecord>{
    for (final r in p.payments) r.monthNo: r,
  };

  if (p.purchaseType == PurchaseType.direct) {
    final rec = payments[1];
    return [
      ScheduleRow(
        monthNo: 1,
        dueDate: rec?.paidAt ?? start,
        amount: p.totalPrice,
        isPaid: true,
        paidAt: rec?.paidAt ?? start,
        isOverdue: false,
      ),
    ];
  }

  final rows = <ScheduleRow>[];
  for (var i = 1; i <= p.months; i++) {
    // Month i due = start + i months (so the first installment lands a month
    // after the commitment date).
    final due = DateTime(start.year, start.month + i, start.day);
    final isPaid = i <= p.paidMonths;
    final rec = payments[i];
    final isOverdue = !isPaid && due.isBefore(today);
    rows.add(
      ScheduleRow(
        monthNo: i,
        dueDate: due,
        amount: p.monthlyPayment,
        isPaid: isPaid,
        paidAt: rec?.paidAt,
        isOverdue: isOverdue,
      ),
    );
  }
  return rows;
}

/// Return the index of the next pending row (or -1 if all paid).
int nextPendingIndex(List<ScheduleRow> schedule) {
  for (var i = 0; i < schedule.length; i++) {
    if (!schedule[i].isPaid) return i;
  }
  return -1;
}
