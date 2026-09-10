import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class CenterCartScreen extends StatefulWidget {
  final CenterRepository repo;
  const CenterCartScreen({super.key, required this.repo});

  @override
  State<CenterCartScreen> createState() => _CenterCartScreenState();
}

class _CenterCartScreenState extends State<CenterCartScreen> {
  bool _submitting = false;

  Future<void> _checkout() async {
    final cart = CenterCart.instance;
    if (cart.isEmpty) return;
    setState(() => _submitting = true);
    try {
      final checkout = await widget.repo.createDonation(
        items: cart.toRequestItems(),
        engraveName: '',
        anonymous: false,
      );
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => CenterPaymentScreen(
            pendingId: checkout.pendingId,
            amount: checkout.amount,
            invoice: checkout.invoice,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: CustomColors.negative,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('center.cart')),
      body: AnimatedBuilder(
        animation: CenterCart.instance,
        builder: (context, _) {
          final cart = CenterCart.instance;
          if (cart.isEmpty) {
            return AppEmptyState(
              icon: Icons.shopping_bag_outlined,
              title: tr('center.cart_empty'),
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              ...cart.lines.map((line) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _CartLineTile(line: line),
                  )),
              _SummaryCard(cart: cart),
            ],
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: AnimatedBuilder(
            animation: CenterCart.instance,
            builder: (context, _) => AppPrimaryButton(
              label: tr('common.confirm'),
              loading: _submitting,
              onPressed: CenterCart.instance.isEmpty || _submitting
                  ? null
                  : _checkout,
            ),
          ),
        ),
      ),
    );
  }
}

/// Order summary — one line per cart item, divider, accent total.
class _SummaryCard extends StatelessWidget {
  final CenterCart cart;
  const _SummaryCard({required this.cart});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final line in cart.lines)
            AppInfoRow(
              dense: true,
              label: '${line.product.name} × ${line.qty}',
              value: formatMNT(line.lineTotal),
            ),
          const AppDivider(vertical: 8),
          AppInfoRow(
            label: tr('center.total_amount'),
            value: formatMNT(cart.total),
            valueColor: CustomColors.accent,
          ),
        ],
      ),
    );
  }
}

class _CartLineTile extends StatelessWidget {
  final CenterCartLine line;
  const _CartLineTile({required this.line});

  @override
  Widget build(BuildContext context) {
    final p = line.product;
    final cover = p.coverImage;
    return AppCard(
      padding: const EdgeInsets.all(10),
      radius: 16,
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 56,
              height: 56,
              color: CustomColors.surfaceAlt,
              child: cover != null
                  ? Image.network(cover,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                          Icons.image_not_supported_outlined,
                          color: Colors.white24,
                          size: 22))
                  : const Icon(Icons.inventory_2_outlined,
                      color: Colors.white24, size: 22),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodyBold.copyWith(fontSize: 13, height: 1.25),
                ),
                const SizedBox(height: 3),
                Text(formatMNT(p.price), style: AppText.caption),
                const SizedBox(height: 4),
                Text(
                  formatMNT(line.lineTotal),
                  style: AppText.bodyBold
                      .copyWith(color: CustomColors.accent, fontSize: 13.5),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _qtyStepper(p.id, line.qty),
        ],
      ),
    );
  }

  Widget _qtyStepper(String id, int qty) {
    return Container(
      decoration: BoxDecoration(
        color: CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _btn(Icons.remove_rounded,
              () => CenterCart.instance.setQty(id, qty - 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text('$qty', style: AppText.bodyBold),
          ),
          _btn(Icons.add_rounded, () => CenterCart.instance.setQty(id, qty + 1)),
        ],
      ),
    );
  }

  Widget _btn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        width: 32,
        height: 32,
        child: Icon(icon, size: 17, color: CustomColors.accent),
      ),
    );
  }
}
