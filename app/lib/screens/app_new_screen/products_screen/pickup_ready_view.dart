import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: [
        _CelebrationHeader(),
        const SizedBox(height: 16),
        _ProductCard(purchase: purchase, productName: ps.name, image: ps.image),
        const SizedBox(height: 16),
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
        const SizedBox(height: 16),
        const _StoreInfoCard(),
        const SizedBox(height: 14),
        const _IdNotice(),
      ],
    );
  }
}

class _CelebrationHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            CustomColors.mainColor.withOpacity(0.18),
            CustomColors.mainColor.withOpacity(0.04),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CustomColors.mainColor.withOpacity(0.35)),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: CustomColors.mainColor.withOpacity(0.22),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.celebration_rounded,
              color: CustomColors.mainColor,
              size: 30,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Баяр хүргэе!',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Та төлбөрөө бүрэн төлж дуусгалаа.\nБараагаа авахад бэлэн боллоо.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.4,
            ),
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
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  formatMNT(purchase.totalPrice),
                  style: TextStyle(
                    color: CustomColors.mainColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  purchase.purchaseType == PurchaseType.installment
                      ? '${purchase.months} сар бүрэн төлсөн'
                      : 'Шууд худалдан авалт',
                  style:
                      const TextStyle(color: Colors.white54, fontSize: 11),
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
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        color: CustomColors.mainColor.withOpacity(0.10),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CustomColors.mainColor.withOpacity(0.55)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.confirmation_number_outlined,
                  size: 16, color: CustomColors.mainColor),
              const SizedBox(width: 6),
              Text(
                'Бараа хүлээн авах код',
                style: TextStyle(
                  color: CustomColors.mainColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              displayCode,
              style: TextStyle(
                color: CustomColors.mainColor,
                fontWeight: FontWeight.w900,
                fontSize: 38,
                letterSpacing: 8,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Энэхүү кодыг манай ажилтанд үзүүлснээр бараагаа авна.',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (code != null && code!.isNotEmpty)
                TextButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: code!));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Код хуулагдлаа'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: CustomColors.mainColor,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    minimumSize: const Size(0, 28),
                  ),
                  icon: const Icon(Icons.copy, size: 14),
                  label: const Text(
                    'Хуулах',
                    style: TextStyle(fontSize: 11),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StoreInfoCard extends StatelessWidget {
  const _StoreInfoCard();

  static const String _address =
      'ХУД, 15-р хороо, Махатма Гандигийн гудамж,\nOne Center /Хуучнаар Home Plaza/';
  static const String _hours = 'Өдөр бүр 11:00 — 20:00';
  static const List<String> _phones = ['7588-8888', '9901-4939'];

  Future<void> _call(String number) async {
    final uri = Uri(scheme: 'tel', path: number.replaceAll('-', ''));
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.storefront_outlined,
                  size: 16, color: Colors.white70),
              SizedBox(width: 6),
              Text(
                'Их хаадын чулуу — Төв салбар',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _InfoRow(icon: Icons.location_on_outlined, text: _address),
          const SizedBox(height: 10),
          _InfoRow(icon: Icons.access_time_rounded, text: _hours),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.phone_outlined,
                  size: 14, color: Colors.white54),
              const SizedBox(width: 8),
              Expanded(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: _phones
                      .map((p) => GestureDetector(
                            onTap: () => _call(p),
                            child: Text(
                              p,
                              style: TextStyle(
                                color: CustomColors.mainColor,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                decoration: TextDecoration.underline,
                                decorationColor:
                                    CustomColors.mainColor.withOpacity(0.6),
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: Colors.white54),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}

class _IdNotice extends StatelessWidget {
  const _IdNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.amber.withOpacity(0.25)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.badge_outlined,
              size: 16, color: Colors.amberAccent),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Бараагаа авахдаа өөрийн биеэр иргэний үнэмлэх (бичиг баримт)-тайгаа ирнэ үү. Бусдад итгэмжлэн өгөх боломжгүй.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
