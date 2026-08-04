import 'package:flutter/material.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
            backgroundColor: CustomColors.alerRed,
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
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          tr('center.cart'),
          style: const TextStyle(
              fontFamily: 'InterBold', fontSize: 13, color: Colors.white),
        ),
        centerTitle: false,
      ),
      body: AnimatedBuilder(
        animation: CenterCart.instance,
        builder: (context, _) {
          final cart = CenterCart.instance;
          if (cart.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.shopping_cart_outlined,
                      color: Colors.white24, size: 48),
                  const SizedBox(height: 12),
                  Text(tr('center.cart_empty'),
                      style:
                          const TextStyle(color: Colors.white54, fontSize: 13)),
                ],
              ),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ...cart.lines.map((line) => _CartLineTile(line: line)),
                  ],
                ),
              ),
              SafeArea(top: false, child: _bottomBar(cart.total)),
            ],
          );
        },
      ),
    );
  }

  Widget _bottomBar(int total) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1C),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.06))),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(tr('center.total_amount'),
                  style: const TextStyle(color: Colors.white54, fontSize: 11)),
              const SizedBox(height: 2),
              Text(
                formatMNT(total),
                style: TextStyle(
                  color: CustomColors.mainColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: MainButton(
              isLoading: _submitting,
              onPress: _submitting ? null : _checkout,
              title: Text(
                tr('common.confirm'),
                style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 14),
              ),
            ),
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
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 56,
              height: 56,
              color: const Color(0xFF252528),
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
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Text(
                  formatMNT(line.lineTotal),
                  style: TextStyle(
                      color: CustomColors.mainColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13),
                ),
              ],
            ),
          ),
          _qtyStepper(p.id, line.qty),
        ],
      ),
    );
  }

  Widget _qtyStepper(String id, int qty) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _btn(Icons.remove, () => CenterCart.instance.setQty(id, qty - 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text('$qty',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold)),
          ),
          _btn(Icons.add, () => CenterCart.instance.setQty(id, qty + 1)),
        ],
      ),
    );
  }

  Widget _btn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 30,
        height: 30,
        child: Icon(icon, size: 15, color: CustomColors.mainColor),
      ),
    );
  }
}
