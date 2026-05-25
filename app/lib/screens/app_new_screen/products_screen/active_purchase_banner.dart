import 'package:flutter/material.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

/// Card that summarises the user's currently-active installment plan.
/// Shows above the products grid when the user has one in flight.
///
/// The progress bar is split into [purchase.months] equal segments — each
/// filled segment represents a paid month.
class ActivePurchaseBanner extends StatelessWidget {
  final ProductPurchase purchase;
  final VoidCallback onTap;

  const ActivePurchaseBanner({
    super.key,
    required this.purchase,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final ps = purchase.productSnapshot;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              CustomColors.mainColor.withOpacity(0.18),
              CustomColors.mainColor.withOpacity(0.06),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border:
              Border.all(color: CustomColors.mainColor.withOpacity(0.45)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top label
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: CustomColors.mainColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Идэвхтэй худалдан авалт',
                    style: TextStyle(
                      color: CustomColors.mainBlack,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  'Дэлгэрэнгүй',
                  style: TextStyle(
                    color: CustomColors.mainColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  size: 16,
                  color: CustomColors.mainColor,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Product row
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 50,
                    height: 50,
                    color: Colors.black26,
                    child: ps.image != null && ps.image!.isNotEmpty
                        ? Image.network(
                            ps.image!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.image_not_supported_outlined,
                              color: Colors.white38,
                            ),
                          )
                        : const Icon(
                            Icons.inventory_2_outlined,
                            color: Colors.white38,
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
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Нийт: ${formatMNT(purchase.totalPrice)}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Segmented progress
            _SegmentedProgress(
              total: purchase.months,
              paid: purchase.paidMonths,
            ),
            const SizedBox(height: 8),

            // Month labels (paid/total)
            Row(
              children: [
                Text(
                  '${purchase.paidMonths}/${purchase.months} сар төлөгдсөн',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Text(
                  '${(purchase.progress * 100).round()}%',
                  style: TextStyle(
                    color: CustomColors.mainColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            // Stats: monthly / paid / next due
            Row(
              children: [
                Expanded(
                  child: _MiniStat(
                    label: 'Сар бүр',
                    value: formatMNT(purchase.monthlyPayment),
                  ),
                ),
                Expanded(
                  child: _MiniStat(
                    label: 'Төлсөн',
                    value: formatMNT(purchase.paidAmount),
                  ),
                ),
                Expanded(
                  child: _MiniStat(
                    label: 'Үлдсэн',
                    value: formatMNT(purchase.remainingAmount),
                    emphasised: true,
                  ),
                ),
              ],
            ),

            if (purchase.nextDueDate != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.25),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.event,
                        size: 13, color: CustomColors.mainColor),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Дараагийн төлбөр',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    Text(
                      _fmtDate(purchase.nextDueDate!),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SegmentedProgress extends StatelessWidget {
  final int total;
  final int paid;

  const _SegmentedProgress({required this.total, required this.paid});

  @override
  Widget build(BuildContext context) {
    final segments = total.clamp(1, 12);
    final paidCount = paid.clamp(0, segments);

    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 4.0;
        final totalGap = gap * (segments - 1);
        final segWidth = (constraints.maxWidth - totalGap) / segments;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: List.generate(segments, (i) {
                final filled = i < paidCount;
                final isLast = i == segments - 1;
                return Padding(
                  padding: EdgeInsets.only(right: isLast ? 0 : gap),
                  child: Container(
                    width: segWidth,
                    height: 8,
                    decoration: BoxDecoration(
                      color: filled
                          ? CustomColors.mainColor
                          : Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: filled
                          ? [
                              BoxShadow(
                                color: CustomColors.mainColor.withOpacity(0.4),
                                blurRadius: 6,
                              ),
                            ]
                          : null,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 4),
            // Show month numbers under each segment (only when there's room)
            if (segments <= 6)
              Row(
                children: List.generate(segments, (i) {
                  final isLast = i == segments - 1;
                  return Padding(
                    padding: EdgeInsets.only(right: isLast ? 0 : gap),
                    child: SizedBox(
                      width: segWidth,
                      child: Text(
                        '${i + 1}',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 9,
                          color: i < paidCount
                              ? CustomColors.mainColor
                              : Colors.white38,
                          fontWeight: i < paidCount
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                  );
                }),
              ),
          ],
        );
      },
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final bool emphasised;

  const _MiniStat({
    required this.label,
    required this.value,
    this.emphasised = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 10),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            color: emphasised ? CustomColors.mainColor : Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

String _fmtDate(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y.$m.$day';
}
