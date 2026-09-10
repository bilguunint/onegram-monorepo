import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_detail_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class MyPurchasesScreen extends StatefulWidget {
  final String uid;

  const MyPurchasesScreen({super.key, required this.uid});

  @override
  State<MyPurchasesScreen> createState() => _MyPurchasesScreenState();
}

class _MyPurchasesScreenState extends State<MyPurchasesScreen> {
  final ProductRepository _repo = ProductRepository();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('purchase.my_purchases')),
      body: StreamBuilder<List<ProductPurchase>>(
        stream: _repo.watchMyPurchases(widget.uid),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
                child: CupertinoActivityIndicator(color: Colors.white));
          }
          if (snapshot.hasError) {
            final err = snapshot.error;
            final stack = snapshot.stackTrace;
            debugPrint('[MyPurchasesScreen] error: $err');
            if (stack != null) debugPrintStack(stackTrace: stack);
            FlutterError.reportError(FlutterErrorDetails(
              exception: err ?? 'Unknown error',
              stack: stack,
              library: 'MyPurchasesScreen',
              context: ErrorDescription('watchMyPurchases stream'),
            ));
            return AppEmptyState(
              icon: Icons.error_outline_rounded,
              iconColor: CustomColors.negative,
              title: tr('purchase.load_error'),
              subtitle: '$err',
            );
          }
          final list = snapshot.data ?? const <ProductPurchase>[];
          if (list.isEmpty) {
            return AppEmptyState(
              icon: Icons.receipt_long_outlined,
              title: tr('purchase.empty_title'),
              subtitle: tr('purchase.empty_subtitle'),
            );
          }
          final sorted = _sortByStatusPriority(list);
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            itemCount: sorted.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final p = sorted[index];
              return _PurchaseRowCard(
                purchase: p,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PurchaseDetailScreen(purchase: p),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

/// Active > completed > delivered > cancelled, within each by startedAt desc
/// (the underlying stream already orders by startedAt desc).
List<ProductPurchase> _sortByStatusPriority(List<ProductPurchase> list) {
  int priority(ProductPurchaseStatus s) {
    switch (s) {
      case ProductPurchaseStatus.active:
        return 0;
      case ProductPurchaseStatus.completed:
        return 1;
      case ProductPurchaseStatus.delivered:
        return 2;
      case ProductPurchaseStatus.cancelled:
        return 3;
    }
  }

  final sorted = [...list]
    ..sort((a, b) => priority(a.status).compareTo(priority(b.status)));
  return sorted;
}

/// Төлөв бүрийн өнгө: active → accent, completed → positive,
/// delivered → textSecondary, cancelled → negative
Color _statusColor(ProductPurchaseStatus status) {
  switch (status) {
    case ProductPurchaseStatus.active:
      return CustomColors.accent;
    case ProductPurchaseStatus.completed:
      return CustomColors.positive;
    case ProductPurchaseStatus.delivered:
      return CustomColors.textSecondary;
    case ProductPurchaseStatus.cancelled:
      return CustomColors.negative;
  }
}

String _statusLabel(ProductPurchaseStatus status) {
  switch (status) {
    case ProductPurchaseStatus.active:
      return tr('purchase.status_active');
    case ProductPurchaseStatus.completed:
      return tr('purchase.status_paid');
    case ProductPurchaseStatus.delivered:
      return tr('purchase.status_delivered');
    case ProductPurchaseStatus.cancelled:
      return tr('purchase.status_cancelled');
  }
}

class _PurchaseRowCard extends StatelessWidget {
  final ProductPurchase purchase;
  final VoidCallback onTap;

  const _PurchaseRowCard({
    required this.purchase,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final ps = purchase.productSnapshot;
    final isInstallment = purchase.purchaseType == PurchaseType.installment;
    final progress = purchase.progress;
    final Color statusColor = _statusColor(purchase.status);

    return GestureDetector(
      onTap: onTap,
      child: AppCard(
        padding: const EdgeInsets.all(12),
        radius: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 56,
                    height: 56,
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
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodyBold,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          AppStatusChip(
                            label: _statusLabel(purchase.status),
                            color: statusColor,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              isInstallment
                                  ? tr('purchase.days_progress', {
                                      'paid': purchase.paidDays,
                                      'total': purchase.totalDays,
                                    })
                                  : tr('purchase.direct_short'),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.caption,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatMNT(purchase.paidAmount),
                      style:
                          AppText.bodyBold.copyWith(color: CustomColors.accent),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '/${formatMNT(purchase.totalPrice)}',
                      style: AppText.caption.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
            if (isInstallment &&
                purchase.status != ProductPurchaseStatus.cancelled) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: Colors.white.withOpacity(0.08),
                  valueColor: AlwaysStoppedAnimation(statusColor),
                ),
              ),
              if (purchase.deadline != null &&
                  purchase.status == ProductPurchaseStatus.active) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.event_rounded,
                      size: 13,
                      color: CustomColors.textSecondary,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      tr('purchase.deadline_with_date',
                          {'date': _fmtDate(purchase.deadline!)}),
                      style: AppText.caption,
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
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
