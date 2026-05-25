import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_payment_screen.dart';
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

  Future<void> _onPayMonthTap(ProductPurchase purchase) async {
    if (_requestingInvoice) return;
    setState(() => _requestingInvoice = true);
    try {
      final invoice = await _repo.requestInstallmentPayment(
        purchaseId: purchase.id,
      );
      if (!mounted) return;
      final nextMonth = purchase.paidMonths + 1;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => InstallmentPaymentScreen(
            purchaseId: purchase.id,
            monthNo: nextMonth,
            amount: purchase.monthlyPayment,
            invoice: invoice,
            productName: purchase.productSnapshot.name,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Алдаа: $e')),
      );
    } finally {
      if (mounted) setState(() => _requestingInvoice = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Live subscription to the purchase doc — when QPay callback marks a
    // month paid, the UI refreshes automatically (progress bar advances,
    // next-pending row moves).
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
          final ps = purchase.productSnapshot;
          final isInstallment =
              purchase.purchaseType == PurchaseType.installment;
          final schedule = buildSchedule(purchase);
          final nextIdx = nextPendingIndex(schedule);
          final showPayButton = isInstallment &&
              purchase.status == ProductPurchaseStatus.active &&
              nextIdx >= 0;

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
              if (purchase.status == ProductPurchaseStatus.cancelled) ...[
                const SizedBox(height: 14),
                _CancelledCard(purchase: purchase),
              ],
              if (showPayButton) ...[
                const SizedBox(height: 14),
                _PayMonthButton(
                  monthNo: nextIdx + 1,
                  amount: purchase.monthlyPayment,
                  busy: _requestingInvoice,
                  onPressed: () => _onPayMonthTap(purchase),
                ),
              ],
              const SizedBox(height: 18),
              Text(
                isInstallment ? 'Төлбөрийн хуваарь' : 'Төлбөрийн мэдээлэл',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              if (isInstallment && purchase.monthlyPayment > 0) ...[
                const SizedBox(height: 4),
                Text(
                  'Нийт ${purchase.months} сар × ${formatMNT(purchase.monthlyPayment)}',
                  style: const TextStyle(
                      color: Colors.white54, fontSize: 11),
                ),
              ],
              const SizedBox(height: 10),
              ...List.generate(schedule.length, (i) {
                final row = schedule[i];
                final isNext = isInstallment &&
                    purchase.status == ProductPurchaseStatus.active &&
                    i == nextIdx;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _ScheduleRowCard(
                    row: row,
                    isNext: isNext,
                    productName: ps.name,
                  ),
                );
              }),
              const SizedBox(height: 10),
              if (purchase.status == ProductPurchaseStatus.active) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: Colors.amber.withOpacity(0.25)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline,
                          size: 14, color: Colors.amberAccent),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Сар бүрийн төлбөрөө тогтсон огноонд хийгээрэй. '
                          'Цуцлах хүсэлт гаргавал шимтгэл хасагдана.',
                          style:
                              TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
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
        title: const Text(
          'Худалдан авалт',
          style: TextStyle(
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

class _PayMonthButton extends StatelessWidget {
  final int monthNo;
  final int amount;
  final bool busy;
  final VoidCallback onPressed;

  const _PayMonthButton({
    required this.monthNo,
    required this.amount,
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
          textStyle:
              const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
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
              ? 'Нэхэмжлэх үүсгэж байна…'
              : '$monthNo-р сарын ${formatMNT(amount)} төлөх',
        ),
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
                      ? '${purchase.months} сар хуваан төлөх'
                      : 'Шууд худалдан авалт',
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
        text = 'Идэвхтэй';
        break;
      case ProductPurchaseStatus.completed:
        bg = const Color(0x3343A047);
        fg = const Color(0xFF7BD389);
        text = 'Бүрэн төлөгдсөн';
        break;
      case ProductPurchaseStatus.delivered:
        bg = const Color(0x33FCD535);
        fg = CustomColors.mainColor;
        text = 'Хүлээлгэн өгсөн';
        break;
      case ProductPurchaseStatus.cancelled:
        bg = const Color(0x33C2240B);
        fg = const Color(0xFFE57373);
        text = 'Цуцалсан';
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
            label: 'Нийт',
            value: formatMNT(purchase.totalPrice),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCell(
            label: 'Төлсөн',
            value: formatMNT(purchase.paidAmount),
            valueColor: CustomColors.mainColor,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCell(
            label: 'Үлдсэн',
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
                  '${purchase.paidMonths}/${purchase.months} сар төлөгдсөн',
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
          const Row(
            children: [
              Icon(Icons.cancel_outlined, color: Color(0xFFE57373), size: 16),
              SizedBox(width: 6),
              Text(
                'Цуцалсан',
                style: TextStyle(
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
              'Шалтгаан: ${purchase.cancelReason}',
              style: const TextStyle(color: Colors.white70, fontSize: 11),
            ),
          if (purchase.refundAmount != null) ...[
            const SizedBox(height: 4),
            Text(
              'Шимтгэл: ${formatMNT(purchase.refundFee ?? 0)}',
              style: const TextStyle(color: Colors.white70, fontSize: 11),
            ),
            Text(
              'Буцаасан дүн: ${formatMNT(purchase.refundAmount!)}',
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

class _ScheduleRowCard extends StatelessWidget {
  final ScheduleRow row;
  final bool isNext;
  final String productName;

  const _ScheduleRowCard({
    required this.row,
    required this.isNext,
    required this.productName,
  });

  @override
  Widget build(BuildContext context) {
    final paid = row.isPaid;
    final overdue = row.isOverdue;

    final Color leftColor;
    final IconData leftIcon;
    if (paid) {
      leftColor = CustomColors.successGreen;
      leftIcon = Icons.check_circle;
    } else if (overdue) {
      leftColor = CustomColors.alerRed;
      leftIcon = Icons.warning_amber_rounded;
    } else if (isNext) {
      leftColor = CustomColors.mainColor;
      leftIcon = Icons.schedule;
    } else {
      leftColor = Colors.white38;
      leftIcon = Icons.circle_outlined;
    }

    final String stateText;
    if (paid) {
      stateText = row.paidAt != null
          ? 'Төлсөн · ${_fmtDate(row.paidAt!)}'
          : 'Төлсөн';
    } else if (overdue) {
      stateText = 'Хоцорсон';
    } else if (isNext) {
      stateText = 'Дараагийн төлбөр';
    } else {
      stateText = 'Хүлээгдэж буй';
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isNext
              ? CustomColors.mainColor.withOpacity(0.55)
              : Colors.white.withOpacity(0.06),
          width: isNext ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: leftColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(leftIcon, size: 16, color: leftColor),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      '${row.monthNo}-р төлбөр',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '· ${_fmtDate(row.dueDate)}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  stateText,
                  style: TextStyle(
                    color: paid
                        ? CustomColors.successGreen
                        : overdue
                            ? const Color(0xFFE57373)
                            : isNext
                                ? CustomColors.mainColor
                                : Colors.white54,
                    fontSize: 11,
                    fontWeight: paid || isNext || overdue
                        ? FontWeight.w600
                        : FontWeight.w400,
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

String _fmtDate(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y.$m.$day';
}
