import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_day_select_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/cancel_installment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/pickup_ready_view.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_schedule.dart';
import 'package:onegrgold/style/colors.dart';

/// Full purchase detail (header card, stats, progress, payment schedule,
/// next-month pay button). Subscribes live to the purchase doc so progress
/// reflects QPay callbacks as they land.
///
/// This is the body content only — no Scaffold/AppBar — so it can be
/// embedded inline (e.g. inside the Products tab when the user has an
/// active installment).
class PurchaseDetailView extends StatefulWidget {
  final ProductPurchase purchase;

  /// Padding around the inner ListView. Default matches the standalone
  /// screen.
  final EdgeInsets padding;

  const PurchaseDetailView({
    super.key,
    required this.purchase,
    this.padding = const EdgeInsets.fromLTRB(16, 12, 16, 32),
  });

  @override
  State<PurchaseDetailView> createState() => _PurchaseDetailViewState();
}

class _PurchaseDetailViewState extends State<PurchaseDetailView> {
  final ProductRepository _repo = ProductRepository();
  bool _requestingInvoice = false;

  Future<void> _onPayDayTap(ProductPurchase purchase) async {
    if (_requestingInvoice) return;

    // Let the user pick how many upcoming days to bundle into one payment.
    final days = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => InstallmentDaySelectSheet(
        nextDay: purchase.paidDays + 1,
        totalDays: purchase.totalDays,
        dailyPayment: purchase.dailyPayment,
        totalPrice: purchase.totalPrice,
        paidAmount: purchase.paidAmount,
      ),
    );
    if (days == null || !mounted) return;

    setState(() => _requestingInvoice = true);
    try {
      final result = await _repo.requestInstallmentPayment(
        purchaseId: purchase.id,
        days: days,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => InstallmentPaymentScreen(
            purchaseId: purchase.id,
            dayFrom: result.dayFrom,
            dayTo: result.dayTo,
            amount: result.amount,
            invoice: result.invoice,
            productName: purchase.productSnapshot.name,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('product.error_with', {'error': e}))),
      );
    } finally {
      if (mounted) setState(() => _requestingInvoice = false);
    }
  }

  Future<void> _onCancelTap(ProductPurchase purchase) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: const Color(0xFF1F1F22),
        title: Text(
          tr('product.cancel_confirm_title'),
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        content: Text(
          tr('product.cancel_confirm_body', {
            'percent': purchase.productSnapshot.cancelFeePercent,
          }),
          style: const TextStyle(color: Colors.white70, fontSize: 12.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(false),
            child: Text(tr('product.no'),
                style: const TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(true),
            child: Text(
              tr('product.yes'),
              style: const TextStyle(
                  color: Color(0xFFE57373), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CancelInstallmentScreen(purchase: purchase),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Live subscription to the purchase doc — when QPay callback marks a
    // day paid, the UI refreshes automatically.
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('product_purchases')
          .doc(widget.purchase.id)
          .snapshots(),
      builder: (context, snapshot) {
        ProductPurchase purchase = widget.purchase;
        final data = snapshot.data?.data();
        if (data != null) {
          purchase = ProductPurchase.fromMap(widget.purchase.id, data);
        }
        final isInstallment = purchase.purchaseType == PurchaseType.installment;
        final history = buildPaymentHistory(purchase);
        final cancelPending = purchase.hasPendingCancelRequest;
        final showPayButton = isInstallment &&
            purchase.status == ProductPurchaseStatus.active &&
            purchase.paidDays < purchase.totalDays &&
            !cancelPending;
        final showCancelButton = isInstallment &&
            purchase.status == ProductPurchaseStatus.active &&
            !cancelPending;
        final nextDay = purchase.paidDays + 1;
        final remainingDays = purchase.totalDays - purchase.paidDays;

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            _HeaderCard(purchase: purchase),
            const SizedBox(height: 14),
            _StatsRow(purchase: purchase),
            if (isInstallment &&
                purchase.status != ProductPurchaseStatus.cancelled) ...[
              const SizedBox(height: 14),
              _ProgressCard(purchase: purchase),
            ],
            if (isInstallment &&
                purchase.status == ProductPurchaseStatus.active &&
                purchase.isPaymentLapsing) ...[
              const SizedBox(height: 14),
              _PaymentLapseWarning(purchase: purchase),
            ],
            if (purchase.status == ProductPurchaseStatus.cancelled) ...[
              const SizedBox(height: 14),
              _CancelledCard(purchase: purchase),
            ],
            if (purchase.status == ProductPurchaseStatus.completed) ...[
              const SizedBox(height: 14),
              PickupInstructionsSection(code: purchase.pickupCode),
            ],
            if (isInstallment &&
                purchase.status == ProductPurchaseStatus.active &&
                cancelPending) ...[
              const SizedBox(height: 14),
              const _CancelPendingBanner(),
            ],
            if (showPayButton) ...[
              const SizedBox(height: 14),
              _PayDayButton(
                nextDay: nextDay,
                remainingDays: remainingDays,
                busy: _requestingInvoice,
                onPressed: () => _onPayDayTap(purchase),
              ),
            ],
            if (showCancelButton) ...[
              const SizedBox(height: 10),
              _CancelInstallmentButton(
                onPressed: () => _onCancelTap(purchase),
              ),
            ],
            const SizedBox(height: 18),
            Text(
              tr('product.payment_history'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            if (isInstallment) ...[
              const SizedBox(height: 4),
              Text(
                tr('product.schedule_summary', {
                  'days': purchase.totalDays,
                  'amount': formatMNT(purchase.dailyPayment),
                  'months': purchase.months,
                }),
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
            ],
            const SizedBox(height: 10),
            if (history.isEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1F1F22),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white.withOpacity(0.06)),
                ),
                child: Text(
                  tr('product.no_payment_history'),
                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                ),
              )
            else
              ...List.generate(history.length, (i) {
                final row = history[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _HistoryRowCard(row: row),
                );
              }),
          ],
        );
      },
    );
  }
}

class PurchaseDetailScreen extends StatelessWidget {
  final ProductPurchase purchase;

  const PurchaseDetailScreen({super.key, required this.purchase});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          tr('product.purchase_title'),
          style: const TextStyle(
            fontFamily: 'InterBold',
            fontSize: 13,
            color: Colors.white,
          ),
        ),
        centerTitle: false,
      ),
      body: PurchaseDetailView(purchase: purchase),
    );
  }
}

class _PayDayButton extends StatelessWidget {
  final int nextDay;
  final int remainingDays;
  final bool busy;
  final VoidCallback onPressed;

  const _PayDayButton({
    required this.nextDay,
    required this.remainingDays,
    required this.busy,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: busy ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: CustomColors.mainColor,
          foregroundColor: CustomColors.mainBlack,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
        icon: busy
            ? const SizedBox(
                height: 14,
                width: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.black54,
                ),
              )
            : const Icon(Icons.qr_code, size: 18),
        label: Text(
          busy
              ? tr('product.creating_invoice')
              : tr('product.pay_from_day', {
                  'day': nextDay,
                  'remaining': remainingDays,
                }),
        ),
      ),
    );
  }
}

class _HistoryRowCard extends StatelessWidget {
  final ScheduleRow row;

  const _HistoryRowCard({required this.row});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: CustomColors.successGreen.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.check_circle,
              size: 16,
              color: CustomColors.successGreen,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tr('product.day_payment', {'day': row.dayNo}),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _fmtDate(row.paidAt),
                  style: TextStyle(
                    color: CustomColors.successGreen,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Text(
            formatMNT(row.amount),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  final ProductPurchase purchase;
  const _HeaderCard({required this.purchase});

  @override
  Widget build(BuildContext context) {
    final ps = purchase.productSnapshot;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 64,
              height: 64,
              color: const Color(0xFF252528),
              child: ps.image != null && ps.image!.isNotEmpty
                  ? Image.network(
                      ps.image!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.image_not_supported_outlined,
                        color: Colors.white24,
                      ),
                    )
                  : const Icon(
                      Icons.inventory_2_outlined,
                      color: Colors.white24,
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ps.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                _StatusBadge(status: purchase.status),
                const SizedBox(height: 4),
                Text(
                  purchase.purchaseType == PurchaseType.installment
                      ? tr('product.installment_summary', {
                          'months': purchase.months,
                          'days': purchase.totalDays,
                        })
                      : tr('product.direct_purchase'),
                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final ProductPurchaseStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String text;
    switch (status) {
      case ProductPurchaseStatus.active:
        bg = const Color(0x331E88E5);
        fg = const Color(0xFF7CC2FF);
        text = tr('product.status_active');
        break;
      case ProductPurchaseStatus.completed:
        bg = const Color(0x3343A047);
        fg = const Color(0xFF7BD389);
        text = tr('product.status_fully_paid');
        break;
      case ProductPurchaseStatus.delivered:
        bg = const Color(0x33FCD535);
        fg = CustomColors.mainColor;
        text = tr('product.status_delivered');
        break;
      case ProductPurchaseStatus.cancelled:
        bg = const Color(0x33C2240B);
        fg = const Color(0xFFE57373);
        text = tr('product.status_cancelled');
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final ProductPurchase purchase;
  const _StatsRow({required this.purchase});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCell(
            label: tr('product.stat_total'),
            value: formatMNT(purchase.totalPrice),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCell(
            label: tr('product.stat_paid'),
            value: formatMNT(purchase.paidAmount),
            valueColor: CustomColors.mainColor,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCell(
            label: tr('product.stat_remaining'),
            value: formatMNT(purchase.remainingAmount),
          ),
        ),
      ],
    );
  }
}

class _StatCell extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _StatCell({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(color: Colors.white54, fontSize: 10)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final ProductPurchase purchase;
  const _ProgressCard({required this.purchase});

  @override
  Widget build(BuildContext context) {
    final daysLeft = purchase.daysUntilDeadline;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  tr('product.days_paid_of', {
                    'paid': purchase.paidDays,
                    'total': purchase.totalDays,
                  }),
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ),
              Text(
                '${(purchase.progress * 100).round()}%',
                style: TextStyle(
                  color: CustomColors.mainColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: purchase.progress,
              minHeight: 6,
              backgroundColor: Colors.white.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation(CustomColors.mainColor),
            ),
          ),
          if (purchase.status == ProductPurchaseStatus.active &&
              purchase.deadline != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.event_outlined,
                    size: 12, color: Colors.white38),
                const SizedBox(width: 4),
                Text(
                  tr('product.deadline_with',
                      {'date': _fmtDate(purchase.deadline!)}),
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 10.5,
                  ),
                ),
                const Spacer(),
                if (daysLeft != null)
                  Text(
                    daysLeft < 0
                        ? tr('product.days_overdue', {'days': -daysLeft})
                        : tr('product.days_left', {'days': daysLeft}),
                    style: TextStyle(
                      color: daysLeft < 0
                          ? const Color(0xFFE57373)
                          : Colors.white54,
                      fontWeight:
                          daysLeft < 0 ? FontWeight.w600 : FontWeight.w500,
                      fontSize: 10.5,
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _CancelledCard extends StatelessWidget {
  final ProductPurchase purchase;
  const _CancelledCard({required this.purchase});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0x33C2240B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x55C2240B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cancel_outlined,
                  color: Color(0xFFE57373), size: 16),
              const SizedBox(width: 6),
              Text(
                tr('product.status_cancelled'),
                style: const TextStyle(
                  color: Color(0xFFE57373),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (purchase.cancelReason != null &&
              purchase.cancelReason!.isNotEmpty)
            Text(
              tr('product.cancel_reason', {'reason': purchase.cancelReason}),
              style: const TextStyle(color: Colors.white70, fontSize: 11),
            ),
          if (purchase.refundAmount != null) ...[
            const SizedBox(height: 4),
            Text(
              tr('product.fee_amount',
                  {'amount': formatMNT(purchase.refundFee ?? 0)}),
              style: const TextStyle(color: Colors.white70, fontSize: 11),
            ),
            Text(
              tr('product.refunded_amount',
                  {'amount': formatMNT(purchase.refundAmount!)}),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Warns an active installment buyer who has gone several days without a
/// payment. Amber while approaching the cancellation threshold, red once the
/// plan is at risk of being cancelled.
class _PaymentLapseWarning extends StatelessWidget {
  final ProductPurchase purchase;
  const _PaymentLapseWarning({required this.purchase});

  @override
  Widget build(BuildContext context) {
    final gap = purchase.daysSinceLastPayment ?? 0;
    final critical = gap >= ProductPurchase.installmentCancelGapDays;
    final remaining = ProductPurchase.installmentCancelGapDays - gap;

    final Color accent =
        critical ? const Color(0xFFE57373) : Colors.amberAccent;
    final Color bg =
        critical ? const Color(0x33C2240B) : Colors.amber.withOpacity(0.10);
    final Color border =
        critical ? const Color(0x55C2240B) : Colors.amber.withOpacity(0.25);

    final String body = critical
        ? tr('product.lapse_critical_body', {'gap': gap})
        : tr('product.lapse_warning_body', {
            'gap': gap,
            'threshold': ProductPurchase.installmentCancelGapDays,
            'extra': remaining > 0
                ? tr('product.lapse_extra_days', {'days': remaining})
                : '',
          });

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            critical ? Icons.warning_amber_rounded : Icons.info_outline,
            color: accent,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  critical
                      ? tr('product.lapse_critical_title')
                      : tr('product.lapse_warning_title'),
                  style: TextStyle(
                    color: accent,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _fmtDate(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y.$m.$day';
}

/// Shown while the user's cancel request awaits admin review — payments are
/// blocked meanwhile (both here and server-side).
class _CancelPendingBanner extends StatelessWidget {
  const _CancelPendingBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.amber.withOpacity(0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.hourglass_top_rounded,
              size: 16, color: Colors.amberAccent),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              tr('product.cancel_pending_banner'),
              style: const TextStyle(
                  color: Colors.white70, fontSize: 11.5, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _CancelInstallmentButton extends StatelessWidget {
  final VoidCallback onPressed;
  const _CancelInstallmentButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: const Color(0xFFE57373).withOpacity(0.6)),
        padding: const EdgeInsets.symmetric(vertical: 13),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      child: Text(
        tr('product.cancel_installment'),
        style: const TextStyle(
          color: Color(0xFFE57373),
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }
}
