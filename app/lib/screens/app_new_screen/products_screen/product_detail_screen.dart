import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/direct_purchase_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_setup_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
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
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('common.details')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          // Image carousel — бөөрөнхий буланд, appBackground дээр
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 1.0,
              child: Container(
                color: CustomColors.surfaceAlt,
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
                                errorBuilder: (_, __, ___) =>
                                    const _ErrorThumb(),
                              );
                            },
                          ),
                          if (images.length > 1)
                            Positioned(
                              left: 0,
                              right: 0,
                              bottom: 12,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(images.length, (i) {
                                  final active = i == _currentImage;
                                  return AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    margin: const EdgeInsets.symmetric(
                                        horizontal: 3),
                                    width: active ? 18 : 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: active
                                          ? CustomColors.accent
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
          ),
          const SizedBox(height: 16),

          // Name + stock
          Text(
            product.name,
            style: AppText.sectionTitle.copyWith(fontSize: 18),
          ),
          if (product.stock != null) ...[
            const SizedBox(height: 4),
            Text(
              tr('product.stock_remaining', {'count': product.stock}),
              style: AppText.caption,
            ),
          ],
          const SizedBox(height: 14),

          _PriceBlock(
            price: product.price,
            maxMonths: maxMonths,
            daily: daily,
          ),

          if (product.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tr('product.description'), style: AppText.sectionTitle),
                  const SizedBox(height: 8),
                  Text(
                    product.description,
                    style: AppText.body
                        .copyWith(color: Colors.white.withOpacity(0.78)),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                AppInfoRow(
                  icon: Icons.calendar_month_outlined,
                  label: tr('product.duration'),
                  value: product.minMonths == product.maxMonths
                      ? tr('product.months_value',
                          {'months': product.maxMonths})
                      : tr('product.months_range', {
                          'min': product.minMonths,
                          'max': product.maxMonths,
                        }),
                ),
                const AppDivider(),
                AppInfoRow(
                  icon: Icons.warning_amber_outlined,
                  label: tr('product.cancel_fee'),
                  value: '${product.cancelFeePercent}%',
                ),
              ],
            ),
          ),

          if (widget.hasActiveInstallment) ...[
            const SizedBox(height: 12),
            AppBanner(text: tr('product.active_installment_banner')),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _BuyButtons(
                busy: _busy,
                available: product.isAvailable && !widget.hasActiveInstallment,
                onInstallment: _onInstallmentTap,
                onDirect: _onDirectTap,
              ),
              if (!product.isAvailable) ...[
                const SizedBox(height: 8),
                Text(
                  tr('product.unavailable'),
                  style: AppText.caption.copyWith(color: CustomColors.negative),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingThumb extends StatelessWidget {
  const _LoadingThumb();
  @override
  Widget build(BuildContext context) {
    return const Center(child: CupertinoActivityIndicator(color: Colors.white));
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

/// Нийт үнэ (том алтан дүн) + хуваан төлөх тайлбар chip
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
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('product.total_price'), style: AppText.caption),
          const SizedBox(height: 4),
          Text(
            formatMNT(price),
            style: AppText.display
                .copyWith(fontSize: 28, color: CustomColors.accent),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
            decoration: BoxDecoration(
              color: CustomColors.accentSoft,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.payments_outlined,
                    size: 14, color: CustomColors.accent),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    tr('product.installment_hint', {
                      'months': maxMonths,
                      'amount': formatMNT(daily),
                    }),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: AppText.bold,
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: CustomColors.accent,
                    ),
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
          child: AppPrimaryButton(
            label: tr('product.buy_installment'),
            onPressed: enabled ? onInstallment : null,
            loading: busy,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: AppPrimaryButton(
            label: tr('product.buy_direct'),
            onPressed: enabled ? onDirect : null,
            outlined: true,
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
    return AppDialog(
      title: tr('product.direct_purchase'),
      icon: Icons.shopping_bag_outlined,
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(product.name, style: AppText.bodyBold),
          const SizedBox(height: 6),
          Text(
            tr('product.direct_purchase_confirm',
                {'amount': formatMNT(product.price)}),
            style: AppText.body
                .copyWith(color: CustomColors.textSecondary, height: 1.45),
          ),
        ],
      ),
      secondaryLabel: tr('product.dismiss'),
      onSecondary: () => Navigator.of(context).pop(false),
      primaryLabel: tr('product.yes_buy'),
      onPrimary: () => Navigator.of(context).pop(true),
    );
  }
}
