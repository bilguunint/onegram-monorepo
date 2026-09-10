import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Compact row that summarises the user's currently-active installment plan.
/// Shows above the products grid when the user has one in flight.
///
/// Зураг, нэр, явцын зураас, өдрийн явцын тайлбар, баруун талд chevron —
/// дарахад дэлгэрэнгүй рүү шилжинэ.
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
    final int percent = (purchase.progress * 100).round();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: GestureDetector(
        onTap: onTap,
        child: AppCard(
          padding: const EdgeInsets.all(12),
          radius: 16,
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 48,
                  height: 48,
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
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            ps.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.bodyBold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        AppStatusChip(label: tr('purchase.active_purchase')),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: purchase.progress,
                        minHeight: 6,
                        backgroundColor: Colors.white.withOpacity(0.08),
                        valueColor: AlwaysStoppedAnimation(CustomColors.accent),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${tr('purchase.days_paid', {
                            'paid': purchase.paidDays,
                            'total': purchase.totalDays,
                          })} · $percent%',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded,
                  size: 20, color: CustomColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
