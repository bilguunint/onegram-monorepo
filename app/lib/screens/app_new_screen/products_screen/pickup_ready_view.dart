import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

/// Congratulation view shown when the user has finished paying for a
/// product (`status == "completed"`) and the item is waiting to be picked up
/// at the One Center store. Displays the 6-digit pickup code, the store
/// info, and ID-required notice.
class PickupReadyView extends StatelessWidget {
  final ProductPurchase purchase;

  const PickupReadyView({super.key, required this.purchase});

  @override
  Widget build(BuildContext context) {
    final ps = purchase.productSnapshot;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        const _CelebrationHeader(),
        const SizedBox(height: 12),
        _ProductCard(purchase: purchase, productName: ps.name, image: ps.image),
        const SizedBox(height: 12),
        PickupInstructionsSection(code: purchase.pickupCode),
      ],
    );
  }
}

/// Reusable block containing the 6-digit pickup code, store info card,
/// and ID-required notice. Used by both [PickupReadyView] (full screen) and
/// the standalone purchase detail screen for completed-but-not-yet-delivered
/// purchases.
class PickupInstructionsSection extends StatelessWidget {
  final String? code;

  const PickupInstructionsSection({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _PickupCodeCard(code: code),
        const SizedBox(height: 12),
        const _StoreInfoCard(),
        const SizedBox(height: 12),
        const _IdNotice(),
      ],
    );
  }
}

class _CelebrationHeader extends StatelessWidget {
  const _CelebrationHeader();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
      child: Column(
        children: [
          AppIconTile(
            size: 72,
            color: CustomColors.accentSoft,
            child: Icon(Icons.celebration_rounded,
                size: 34, color: CustomColors.accent),
          ),
          const SizedBox(height: 14),
          Text(
            tr('purchase.congrats'),
            textAlign: TextAlign.center,
            style: AppText.sectionTitle.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 6),
          Text(
            tr('purchase.pickup_ready_subtitle'),
            textAlign: TextAlign.center,
            style: AppText.caption,
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final ProductPurchase purchase;
  final String productName;
  final String? image;

  const _ProductCard({
    required this.purchase,
    required this.productName,
    required this.image,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              width: 64,
              height: 64,
              color: CustomColors.surfaceAlt,
              child: image != null && image!.isNotEmpty
                  ? Image.network(
                      image!,
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
                  productName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodyBold,
                ),
                const SizedBox(height: 6),
                Text(
                  formatMNT(purchase.totalPrice),
                  style: AppText.bodyBold.copyWith(color: CustomColors.accent),
                ),
                const SizedBox(height: 4),
                Text(
                  purchase.purchaseType == PurchaseType.installment
                      ? tr('purchase.months_fully_paid',
                          {'months': purchase.months})
                      : tr('purchase.direct_purchase'),
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

class _PickupCodeCard extends StatelessWidget {
  final String? code;

  const _PickupCodeCard({required this.code});

  @override
  Widget build(BuildContext context) {
    final displayCode = (code == null || code!.isEmpty) ? '------' : code!;
    return AppCard(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.confirmation_number_outlined,
                  size: 15, color: CustomColors.textSecondary),
              const SizedBox(width: 6),
              Text(tr('purchase.pickup_code_label'), style: AppText.caption),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            displayCode,
            textAlign: TextAlign.center,
            style: AppText.display.copyWith(
              color: CustomColors.accent,
              letterSpacing: 4,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            tr('purchase.pickup_code_hint'),
            textAlign: TextAlign.center,
            style: AppText.caption,
          ),
          if (code != null && code!.isNotEmpty) ...[
            const SizedBox(height: 14),
            Material(
              color: CustomColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: code!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(tr('purchase.code_copied')),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.copy_rounded,
                          size: 15, color: Colors.white),
                      const SizedBox(width: 6),
                      Text(tr('purchase.copy'),
                          style: AppText.bodyBold.copyWith(fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StoreInfoCard extends StatelessWidget {
  const _StoreInfoCard();

  String get _address => tr('purchase.store_address');
  String get _hours => tr('purchase.store_hours');
  static const List<String> _phones = ['7588-8888', '9901-4939'];

  Future<void> _call(String number) async {
    final uri = Uri(scheme: 'tel', path: number.replaceAll('-', ''));
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppListRow(
            leading: AppIconTile(
              size: 40,
              child: Icon(Icons.storefront_outlined,
                  size: 18, color: CustomColors.accent),
            ),
            title: tr('purchase.store_name'),
            subtitle: _address,
          ),
          const AppDivider(vertical: 0),
          AppListRow(
            leading: AppIconTile(
              size: 40,
              child: Icon(Icons.access_time_rounded,
                  size: 18, color: CustomColors.textSecondary),
            ),
            title: _hours,
          ),
          const AppDivider(vertical: 0),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              children: [
                AppIconTile(
                  size: 40,
                  child: Icon(Icons.phone_outlined,
                      size: 18, color: CustomColors.textSecondary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Wrap(
                    spacing: 12,
                    runSpacing: 4,
                    children: _phones
                        .map((p) => GestureDetector(
                              onTap: () => _call(p),
                              child: Text(
                                p,
                                style: AppText.link.copyWith(
                                  fontSize: 14,
                                  decoration: TextDecoration.underline,
                                  decorationColor:
                                      CustomColors.accent.withOpacity(0.6),
                                ),
                              ),
                            ))
                        .toList(),
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

class _IdNotice extends StatelessWidget {
  const _IdNotice();

  @override
  Widget build(BuildContext context) {
    return AppBanner(
      icon: Icons.badge_outlined,
      text: tr('purchase.id_required_notice'),
    );
  }
}
