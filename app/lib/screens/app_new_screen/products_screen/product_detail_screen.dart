import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/direct_purchase_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_setup_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  final String uid;
  final UserRepository userRepository;

  /// True when the user already has an active installment plan. New purchases
  /// (both installment and direct) are disallowed until the existing plan is
  /// completed/cancelled.
  final bool hasActiveInstallment;

  const ProductDetailScreen({
    super.key,
    required this.product,
    required this.uid,
    required this.userRepository,
    this.hasActiveInstallment = false,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ProductRepository _productRepo = ProductRepository();
  final PageController _pageController = PageController();
  int _currentImage = 0;
  bool _busy = false;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _onInstallmentTap() async {
    if (_busy) return;
    if (widget.hasActiveInstallment) {
      _showSnack(tr('product.active_installment_exists'));
      return;
    }
    final months = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => InstallmentSetupSheet(product: widget.product),
    );
    if (months == null) return;

    setState(() => _busy = true);
    try {
      // Ask the backend for a QPay invoice for the first month. The
      // `product_purchases` doc is NOT created up front — only after this
      // first payment lands does the corresponding callback materialise it.
      final result = await _productRepo.requestInstallmentInit(
        productId: widget.product.id,
        months: months,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DirectPurchasePaymentScreen(
            pendingId: result.pendingId,
            amount: result.amount,
            invoice: result.invoice,
            productName: widget.product.name,
            appBarTitleKey: 'product.installment_day_one_title',
            successTitleKey: 'product.installment_started',
            successMessageKey: 'product.installment_started_message',
            successMessageParams: {
              'amount': formatMNT(result.amount),
              'months': months,
            },
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showSnack(tr('product.error_with', {'error': e}));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _onDirectTap() async {
    if (_busy) return;
    if (widget.hasActiveInstallment) {
      _showSnack(tr('product.active_installment_exists'));
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => _DirectPurchaseDialog(product: widget.product),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      final result = await _productRepo.requestDirectPurchasePayment(
        productId: widget.product.id,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DirectPurchasePaymentScreen(
            pendingId: result.pendingId,
            amount: widget.product.price,
            invoice: result.invoice,
            productName: widget.product.name,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showSnack(tr('product.error_with', {'error': e}));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final images = product.images;
    final maxMonths = product.maxMonths.clamp(1, 12);
    final daily = dailyAmount(product.price, maxMonths);

    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        title: Text(
          tr('common.details'),
          style: const TextStyle(
            fontFamily: 'InterBold',
            fontSize: 13,
            color: Colors.white,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        centerTitle: false,
      ),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Image carousel
          AspectRatio(
            aspectRatio: 1.0,
            child: Container(
              color: const Color(0xFF252528),
              child: images.isEmpty
                  ? const Center(
                      child: Icon(
                        Icons.inventory_2_outlined,
                        color: Colors.white24,
                        size: 64,
                      ),
                    )
                  : Stack(
                      children: [
                        PageView.builder(
                          controller: _pageController,
                          onPageChanged: (i) =>
                              setState(() => _currentImage = i),
                          itemCount: images.length,
                          itemBuilder: (_, i) {
                            return Image.network(
                              images[i],
                              fit: BoxFit.cover,
                              width: double.infinity,
                              loadingBuilder: (_, child, p) =>
                                  p == null ? child : const _LoadingThumb(),
                              errorBuilder: (_, __, ___) => const _ErrorThumb(),
                            );
                          },
                        ),
                        if (images.length > 1)
                          Positioned(
                            left: 0,
                            right: 0,
                            bottom: 10,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(images.length, (i) {
                                final active = i == _currentImage;
                                return AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 3),
                                  width: active ? 18 : 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: active
                                        ? CustomColors.mainColor
                                        : Colors.white.withOpacity(0.4),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                );
                              }),
                            ),
                          ),
                      ],
                    ),
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 6),
                if (product.stock != null)
                  Text(
                    tr('product.stock_remaining', {'count': product.stock}),
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 11,
                    ),
                  ),
                const SizedBox(height: 14),
                _PriceBlock(
                  price: product.price,
                  maxMonths: maxMonths,
                  daily: daily,
                ),
                if (product.description.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    tr('product.description'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    product.description,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      height: 1.45,
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                _InfoTile(
                  icon: Icons.calendar_month_outlined,
                  label: tr('product.duration'),
                  value: product.minMonths == product.maxMonths
                      ? tr(
                          'product.months_value', {'months': product.maxMonths})
                      : tr('product.months_range', {
                          'min': product.minMonths,
                          'max': product.maxMonths,
                        }),
                ),
                _InfoTile(
                  icon: Icons.warning_amber_outlined,
                  label: tr('product.cancel_fee'),
                  value: '${product.cancelFeePercent}%',
                ),
                const SizedBox(height: 16),
                if (widget.hasActiveInstallment) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.10),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amber.withOpacity(0.35)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline,
                            color: Colors.amberAccent, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            tr('product.active_installment_banner'),
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _BuyButtons(
                  busy: _busy,
                  available:
                      product.isAvailable && !widget.hasActiveInstallment,
                  onInstallment: _onInstallmentTap,
                  onDirect: _onDirectTap,
                ),
                if (!product.isAvailable) ...[
                  const SizedBox(height: 8),
                  Text(
                    tr('product.unavailable'),
                    style:
                        const TextStyle(color: Colors.redAccent, fontSize: 11),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingThumb extends StatelessWidget {
  const _LoadingThumb();
  @override
  Widget build(BuildContext context) {
    return const Center(child: CupertinoActivityIndicator());
  }
}

class _ErrorThumb extends StatelessWidget {
  const _ErrorThumb();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Icon(
        Icons.broken_image_outlined,
        color: Colors.white24,
        size: 48,
      ),
    );
  }
}

class _PriceBlock extends StatelessWidget {
  final int price;
  final int maxMonths;
  final int daily;

  const _PriceBlock({
    required this.price,
    required this.maxMonths,
    required this.daily,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr('product.total_price'),
            style:
                TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 11),
          ),
          const SizedBox(height: 4),
          Text(
            formatMNT(price),
            style: TextStyle(
              color: CustomColors.mainColor,
              fontWeight: FontWeight.bold,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.payments_outlined,
                    size: 14, color: Colors.white.withOpacity(0.6)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    tr('product.installment_hint', {
                      'months': maxMonths,
                      'amount': formatMNT(daily),
                    }),
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.white.withOpacity(0.5)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w500, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _BuyButtons extends StatelessWidget {
  final bool busy;
  final bool available;
  final VoidCallback onInstallment;
  final VoidCallback onDirect;

  const _BuyButtons({
    required this.busy,
    required this.available,
    required this.onInstallment,
    required this.onDirect,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = available && !busy;
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: enabled ? onInstallment : null,
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
            child: busy
                ? const SizedBox(
                    height: 14,
                    width: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(tr('product.buy_installment')),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton(
            onPressed: enabled ? onDirect : null,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: BorderSide(color: Colors.white.withOpacity(0.25)),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              textStyle:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            child: Text(tr('product.buy_direct')),
          ),
        ),
      ],
    );
  }
}

class _DirectPurchaseDialog extends StatelessWidget {
  final Product product;
  const _DirectPurchaseDialog({required this.product});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1F1F22),
      title: Text(
        tr('product.direct_purchase'),
        style: const TextStyle(color: Colors.white, fontSize: 14),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            product.name,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            tr('product.direct_purchase_confirm',
                {'amount': formatMNT(product.price)}),
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(
            tr('product.dismiss'),
            style: const TextStyle(color: Colors.white54),
          ),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: ElevatedButton.styleFrom(
            backgroundColor: CustomColors.mainColor,
            foregroundColor: CustomColors.mainBlack,
          ),
          child: Text(tr('product.yes_buy')),
        ),
      ],
    );
  }
}
