import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_day_select_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/cancel_installment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/gold_grams_select_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/pickup_ready_view.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_schedule.dart';
import 'package:onegrgold/style/app_text.dart';
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

  /// Алтан эдлэл: граммаа сонгоод өнөөдрийн ханшаар QR төлнө.
  Future<void> _onPayGramsTap(ProductPurchase purchase) async {
    if (_requestingInvoice) return;
    final grams = await showModalBottomSheet<double>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => GoldGramsSelectSheet(
        remainingGrams: purchase.remainingGrams,
        dailyGrams: purchase.dailyGrams,
      ),
    );
    if (grams == null || !mounted) return;

    setState(() => _requestingInvoice = true);
    try {
      final result = await _repo.requestGoldInstallmentPayment(
        purchaseId: purchase.id,
        grams: grams,
        paidGramsNow: purchase.paidGrams,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => InstallmentPaymentScreen(
            purchaseId: purchase.id,
            dayFrom: 0,
            dayTo: 0,
            amount: result.amount,
            invoice: result.invoice,
            productName: purchase.productSnapshot.name,
            targetPaidGrams: result.targetPaidGrams,
            gramsLabel: formatGrams(result.grams),
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
      builder: (dialogCtx) => AppDialog(
        icon: Icons.warning_amber_rounded,
        danger: true,
        title: tr('product.cancel_confirm_title'),
        message: tr('product.cancel_confirm_body', {
          'percent': purchase.productSnapshot.cancelFeePercent,
        }),
        secondaryLabel: tr('product.no'),
        onSecondary: () => Navigator.of(dialogCtx).pop(false),
        primaryLabel: tr('product.yes'),
        onPrimary: () => Navigator.of(dialogCtx).pop(true),
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
        final isGold = purchase.isGold;
        final isInstallment = purchase.isAnyInstallment;
        final history = buildPaymentHistory(purchase);
        final cancelPending = purchase.hasPendingCancelRequest;
        final hasRemaining = isGold
            ? purchase.remainingGrams > 0
            : purchase.paidDays < purchase.totalDays;
        final showPayButton = isInstallment &&
            purchase.status == ProductPurchaseStatus.active &&
            hasRemaining &&
            !cancelPending;
        final showCancelAction = isInstallment &&
            purchase.status == ProductPurchaseStatus.active &&
            !cancelPending;
        final nextDay = purchase.paidDays + 1;
        final remainingDays = purchase.totalDays - purchase.paidDays;

        // Дараагийн төлөгдөөгүй өдрийг түүхийн дээр "хүлээгдэж буй" мөрөөр
        // харуулна — хоцорсон бол улаан анхааруулгатай.
        final ScheduleRow? upcoming = showPayButton && !isGold
            ? ScheduleRow(
                dayNo: nextDay,
                paidAt: DateTime.now(),
                amount: purchase.dailyPayment,
              )
            : null;

        return Column(
          children: [
            Expanded(
              child: ListView(
                padding: widget.padding,
                children: [
                  _HeaderCard(purchase: purchase),
                  const SizedBox(height: 12),
                  if (isInstallment &&
                      purchase.status != ProductPurchaseStatus.cancelled)
                    _ProgressCard(purchase: purchase)
                  else
                    _AmountsCard(purchase: purchase),
                  if (purchase.status == ProductPurchaseStatus.cancelled) ...[
                    const SizedBox(height: 12),
                    _CancelledCard(purchase: purchase),
                  ],
                  if (purchase.status == ProductPurchaseStatus.completed) ...[
                    const SizedBox(height: 12),
                    PickupInstructionsSection(code: purchase.pickupCode),
                  ],
                  if (isInstallment &&
                      purchase.status == ProductPurchaseStatus.active &&
                      cancelPending) ...[
                    const SizedBox(height: 12),
                    const _CancelPendingBanner(),
                  ],
                  const SizedBox(height: 24),
                  Text(tr('product.payment_history'),
                      style: AppText.sectionTitle),
                  if (isInstallment) ...[
                    const SizedBox(height: 4),
                    Text(
                      isGold
                          ? tr('gold.history_hint')
                          : tr('product.schedule_summary', {
                              'days': purchase.totalDays,
                              'amount': formatMNT(purchase.dailyPayment),
                              'months': purchase.months,
                            }),
                      style: AppText.caption,
                    ),
                  ],
                  const SizedBox(height: 12),
                  _HistoryCard(
                    history: history,
                    upcoming: upcoming,
                  ),
                ],
              ),
            ),
            if (showPayButton || showCancelAction)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showPayButton)
                        AppPrimaryButton(
                          label: _requestingInvoice
                              ? tr('product.creating_invoice')
                              : isGold
                                  ? tr('gold.pay_next')
                                  : tr('product.pay_from_day', {
                                      'day': nextDay,
                                      'remaining': remainingDays,
                                    }),
                          icon: Icons.qr_code_rounded,
                          loading: _requestingInvoice,
                          onPressed: () => isGold
                              ? _onPayGramsTap(purchase)
                              : _onPayDayTap(purchase),
                        ),
                      if (showPayButton && showCancelAction)
                        const SizedBox(height: 8),
                      if (showCancelAction)
                        AppPrimaryButton(
                          label: tr('product.cancel_installment'),
                          outlined: true,
                          onPressed: () => _onCancelTap(purchase),
                        ),
                    ],
                  ),
                ),
              ),
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
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('product.purchase_title')),
      body: PurchaseDetailView(purchase: purchase),
    );
  }
}

/// Төлбөрийн түүх — нэг картанд AppListRow мөрүүд, AppDivider-ээр тусгаарлана.
class _HistoryCard extends StatelessWidget {
  final List<ScheduleRow> history;

  /// Дараагийн төлөгдөөгүй өдөр (байхгүй бол null).
  final ScheduleRow? upcoming;

  /// Дараагийн өдрийн төлбөр хоцорсон эсэх — улаан icon.

  const _HistoryCard({
    required this.history,
    required this.upcoming,
  });

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty && upcoming == null) {
      return AppCard(
        child: Text(tr('product.no_payment_history'), style: AppText.caption),
      );
    }

    final List<Widget> rows = [];
    if (upcoming != null) {
      final Color c = CustomColors.textSecondary;
      rows.add(AppListRow(
        leading: AppIconTile(
          size: 40,
          color: c.withOpacity(0.15),
          child: Icon(
            Icons.schedule_rounded,
            size: 18,
            color: c,
          ),
        ),
        title: tr('product.day_payment', {'day': upcoming!.dayNo}),
        subtitle: tr('common.pending'),
        trailing: Text(formatMNT(upcoming!.amount),
            style: AppText.bodyBold.copyWith(color: c)),
      ));
    }
    for (final row in history) {
      rows.add(AppListRow(
        leading: AppIconTile(
          size: 40,
          color: CustomColors.positive.withOpacity(0.15),
          child:
              Icon(Icons.check_rounded, size: 18, color: CustomColors.positive),
        ),
        title: row.grams != null
            ? tr('gold.payment_row', {
                'grams': formatGrams(row.grams!),
                'rate': formatMNT(row.rate ?? 0),
              })
            : tr('product.day_payment', {'day': row.dayNo}),
        subtitle: _fmtDate(row.paidAt),
        trailing: Text(formatMNT(row.amount), style: AppText.bodyBold),
      ));
    }

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          for (int i = 0; i < rows.length; i++) ...[
            if (i > 0) const AppDivider(vertical: 0),
            rows[i],
          ],
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
    return AppCard(
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              width: 64,
              height: 64,
              color: CustomColors.surfaceAlt,
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
                  style: AppText.bodyBold,
                ),
                const SizedBox(height: 6),
                _StatusBadge(status: purchase.status),
                const SizedBox(height: 6),
                Text(
                  purchase.isGold
                      ? tr('gold.summary', {
                          'total': formatGrams(purchase.totalGrams),
                          'daily': formatGrams(purchase.dailyGrams),
                        })
                      : purchase.purchaseType == PurchaseType.installment
                          ? tr('product.installment_summary', {
                              'months': purchase.months,
                              'days': purchase.totalDays,
                            })
                          : tr('product.direct_purchase'),
                  style: AppText.caption,
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
    Color color;
    String text;
    switch (status) {
      case ProductPurchaseStatus.active:
        color = CustomColors.accent;
        text = tr('product.status_active');
        break;
      case ProductPurchaseStatus.completed:
        color = CustomColors.positive;
        text = tr('product.status_fully_paid');
        break;
      case ProductPurchaseStatus.delivered:
        color = CustomColors.textSecondary;
        text = tr('product.status_delivered');
        break;
      case ProductPurchaseStatus.cancelled:
        color = CustomColors.negative;
        text = tr('product.status_cancelled');
        break;
    }
    return AppStatusChip(label: text, color: color);
  }
}

/// Нийт / төлсөн / үлдсэн дүн — шууд худалдан авалт болон цуцлагдсан
/// захиалгад (явцын карт харагдахгүй үед).
class _AmountsCard extends StatelessWidget {
  final ProductPurchase purchase;
  const _AmountsCard({required this.purchase});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          AppInfoRow(
            label: tr('product.stat_total'),
            value: formatMNT(purchase.totalPrice),
          ),
          AppInfoRow(
            label: tr('product.stat_paid'),
            value: formatMNT(purchase.paidAmount),
            valueColor: CustomColors.accent,
          ),
          AppInfoRow(
            label: tr('product.stat_remaining'),
            value: formatMNT(purchase.remainingAmount),
          ),
        ],
      ),
    );
  }
}

/// Явцын карт — том төлсөн дүн, "/ нийт", явцын зураас, өдрийн явц ба
/// дуусах хугацааны мөрүүд.
class _ProgressCard extends StatelessWidget {
  final ProductPurchase purchase;
  const _ProgressCard({required this.purchase});

  @override
  Widget build(BuildContext context) {
    final daysLeft = purchase.daysUntilDeadline;
    if (purchase.isGold) {
      // Алтан эдлэл: явц граммаар. Deadline нь зөвхөн санал тул харуулахгүй.
      return AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                tr('gold.grams_paid_of', {
                  'paid': formatGrams(purchase.paidGrams),
                  'total': formatGrams(purchase.totalGrams),
                }),
                style: AppText.caption),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Flexible(
                  child: Text(
                    formatGrams(purchase.paidGrams),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.display.copyWith(fontSize: 28),
                  ),
                ),
                const SizedBox(width: 6),
                Text('/ ${formatGrams(purchase.totalGrams)}',
                    style: AppText.caption.copyWith(fontSize: 13)),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: purchase.progress,
                minHeight: 6,
                backgroundColor: Colors.white.withOpacity(0.08),
                valueColor: AlwaysStoppedAnimation(CustomColors.accent),
              ),
            ),
            const SizedBox(height: 8),
            const AppDivider(),
            AppInfoRow(
              icon: Icons.account_balance_wallet_outlined,
              label: tr('gold.paid_total_amount'),
              value: formatMNT(purchase.paidAmount),
              valueColor: CustomColors.accent,
            ),
            AppInfoRow(
              icon: Icons.scale_outlined,
              label: tr('gold.remaining_label'),
              value: formatGrams(purchase.remainingGrams),
            ),
          ],
        ),
      );
    }
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('product.stat_paid'), style: AppText.caption),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Flexible(
                child: Text(
                  formatMNT(purchase.paidAmount),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.display.copyWith(fontSize: 28),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '/ ${formatMNT(purchase.totalPrice)}',
                style: AppText.caption.copyWith(fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: purchase.progress,
              minHeight: 6,
              backgroundColor: Colors.white.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation(CustomColors.accent),
            ),
          ),
          const SizedBox(height: 8),
          const AppDivider(),
          AppInfoRow(
            icon: Icons.calendar_today_outlined,
            label: tr('product.days_paid_of', {
              'paid': purchase.paidDays,
              'total': purchase.totalDays,
            }),
            value: '${(purchase.progress * 100).round()}%',
            valueColor: CustomColors.accent,
          ),
          AppInfoRow(
            icon: Icons.account_balance_wallet_outlined,
            label: tr('product.stat_remaining'),
            value: formatMNT(purchase.remainingAmount),
          ),
          if (purchase.status == ProductPurchaseStatus.active &&
              purchase.deadline != null)
            AppInfoRow(
              icon: Icons.event_outlined,
              label: tr('product.deadline_with',
                  {'date': _fmtDate(purchase.deadline!)}),
              // Хугацаа хэтэрсэн ч "хоцорсон" гэж улаанаар бичихгүй — зөвхөн
              // огноог харуулна. Хуваан төлөлт дарамтгүй байх бодлого (2026-11).
              value: daysLeft == null || daysLeft < 0
                  ? _fmtDate(purchase.deadline!)
                  : tr('product.days_left', {'days': daysLeft}),
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
    final List<String> details = [
      if (purchase.cancelReason != null && purchase.cancelReason!.isNotEmpty)
        tr('product.cancel_reason', {'reason': purchase.cancelReason}),
      if (purchase.refundAmount != null) ...[
        tr('product.fee_amount',
            {'amount': formatMNT(purchase.refundFee ?? 0)}),
        tr('product.refunded_amount',
            {'amount': formatMNT(purchase.refundAmount!)}),
      ],
    ];
    if (details.isEmpty) {
      return AppBanner(
        icon: Icons.cancel_outlined,
        color: CustomColors.negative,
        text: tr('product.status_cancelled'),
      );
    }
    return AppBanner(
      icon: Icons.cancel_outlined,
      color: CustomColors.negative,
      title: tr('product.status_cancelled'),
      text: details.join('\n'),
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
    return AppBanner(
      icon: Icons.hourglass_top_rounded,
      text: tr('product.cancel_pending_banner'),
    );
  }
}
