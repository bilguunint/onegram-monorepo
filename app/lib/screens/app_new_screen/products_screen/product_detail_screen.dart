import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/direct_purchase_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/gold_installment_setup_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/installment_setup_sheet.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  final String uid;
  final UserRepository userRepository;

  /// Хэрэглэгчийн одоо явж буй хуваан төлөлтийн тоо. Энэ нь
  /// [ProductPurchase.maxActiveInstallments] хүрсэн үед шинэ хуваан төлөлт
  /// эхлүүлэх товч идэвхгүй болно.
  ///
  /// ШУУД худалдан авалтад энэ хязгаар хамаарахгүй — тэр нь төлбөрөө шууд
  /// төлж "completed" болдог тул хэзээ ч "идэвхтэй" төлөвт үлддэггүй.
  final int activeInstallmentCount;

  const ProductDetailScreen({
    super.key,
    required this.product,
    required this.uid,
    required this.userRepository,
    this.activeInstallmentCount = 0,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ProductRepository _productRepo = ProductRepository();
  final PageController _pageController = PageController();
  int _currentImage = 0;
  bool _busy = false;

  /// Алтан эдлэлд: өнөөдрийн 1 гр үнэ (ханшаар ойролцоо нийт дүн харуулахад).
  GoldQuote? _goldQuote;

  @override
  void initState() {
    super.initState();
    if (widget.product.isGoldJewelry) {
      _productRepo.fetchGoldQuote().then((q) {
        if (mounted) setState(() => _goldQuote = q);
      }).catchError((_) {});
    }
  }

  /// Хязгаарт хүрээгүй бол шинэ хуваан төлөлт эхлүүлж болно. Жинхэнэ
  /// хамгаалалт нь createInstallmentInit дээр — энэ нь зөвхөн UI-г
  /// урьдчилан хаадаг.
  bool get _canStartInstallment =>
      widget.activeInstallmentCount < ProductPurchase.maxActiveInstallments;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _onInstallmentTap() async {
    if (_busy) return;
    if (!_canStartInstallment) {
      _showSnack(tr('product.active_installment_exists',
          {'max': ProductPurchase.maxActiveInstallments}));
      return;
    }
    if (widget.product.isGoldJewelry) {
      await _onGoldInstallmentTap();
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

  /// Алтан эдлэл: өдрийн граммаа сонгоод эхний граммын QR-ыг төлнө.
  Future<void> _onGoldInstallmentTap() async {
    final daily = await showModalBottomSheet<double>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => GoldInstallmentSetupSheet(product: widget.product),
    );
    if (daily == null || !mounted) return;

    setState(() => _busy = true);
    try {
      final result = await _productRepo.requestGoldInstallmentInit(
        productId: widget.product.id,
        dailyGrams: daily,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DirectPurchasePaymentScreen(
            pendingId: result.pendingId,
            amount: result.amount,
            invoice: result.invoice,
            productName: widget.product.name,
            appBarTitleKey: 'gold.first_payment_title',
            successTitleKey: 'gold.started',
            successMessageKey: 'gold.started_message',
            successMessageParams: {'grams': formatGrams(result.grams)},
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
    // Шууд худалдан авалтад хуваан төлөлтийн хязгаар хамаарахгүй — энэ нь
    // тусдаа, шууд төлөгддөг гүйлгээ.
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

          if (product.isGoldJewelry)
            _GoldPriceBlock(product: product, quote: _goldQuote)
          else
            _PriceBlock(
              price: product.price,
              maxMonths: maxMonths,
              daily: daily,
            ),

          if (product.isGoldJewelry) ...[
            const SizedBox(height: 12),
            _GoldPlanInfoCard(product: product, quote: _goldQuote),
          ],

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
                if (!product.isGoldJewelry) ...[
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
                ],
                AppInfoRow(
                  icon: Icons.warning_amber_outlined,
                  label: tr('product.cancel_fee'),
                  value: '${product.cancelFeePercent}%',
                ),
              ],
            ),
          ),

          if (!_canStartInstallment) ...[
            const SizedBox(height: 12),
            AppBanner(
              text: tr('product.active_installment_banner',
                  {'max': ProductPurchase.maxActiveInstallments}),
            ),
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
                installmentAvailable:
                    product.isAvailable && _canStartInstallment,
                // Алтан эдлэлийг шууд (бүтэн үнээр) авах боломжгүй —
                // зөвхөн граммаар цуглуулна.
                directAvailable: product.isAvailable && !product.isGoldJewelry,
                showDirect: !product.isGoldJewelry,
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

  /// Хуваан төлөлт эхлүүлж болох эсэх — бараа боломжтой БА хэрэглэгч
  /// зэрэгцээ төлөлтийн хязгаарт хүрээгүй.
  final bool installmentAvailable;

  /// Шууд худалдан авалт хийж болох эсэх — зөвхөн барааны боломжоос
  /// хамаарна (хуваан төлөлтийн хязгаар үүнд хамаарахгүй).
  final bool directAvailable;

  final VoidCallback onInstallment;
  final VoidCallback onDirect;

  /// Шууд авах товчийг харуулах эсэх (алтан эдлэлд үгүй).
  final bool showDirect;

  const _BuyButtons({
    required this.busy,
    required this.installmentAvailable,
    required this.directAvailable,
    required this.onInstallment,
    required this.onDirect,
    this.showDirect = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: AppPrimaryButton(
            label: showDirect
                ? tr('product.buy_installment')
                : tr('gold.start_title'),
            onPressed: installmentAvailable && !busy ? onInstallment : null,
            loading: busy,
          ),
        ),
        if (showDirect) ...[
          const SizedBox(width: 10),
          Expanded(
            child: AppPrimaryButton(
              label: tr('product.buy_direct'),
              onPressed: directAvailable && !busy ? onDirect : null,
              outlined: true,
            ),
          ),
        ],
      ],
    );
  }
}

/// Алтан эдлэлийн үнийн блок: нийт грамм (том), өнөөдрийн ханшаар ойролцоо
/// нийт дүн, "0.1 гр-аас эхлэн" chip.
class _GoldPriceBlock extends StatelessWidget {
  final Product product;
  final GoldQuote? quote;
  const _GoldPriceBlock({required this.product, required this.quote});

  @override
  Widget build(BuildContext context) {
    final q = quote;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('gold.total_grams'), style: AppText.caption),
          const SizedBox(height: 4),
          Text(
            formatGrams(product.totalGrams),
            style: AppText.display
                .copyWith(fontSize: 28, color: CustomColors.accent),
          ),
          const SizedBox(height: 4),
          Text(
            q == null
                ? tr('gold.quote_loading')
                : tr('gold.at_today_rate',
                    {'amount': formatMNT(q.amountFor(product.totalGrams))}),
            style: AppText.caption,
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
                    q == null
                        ? tr('gold.card_hint', {'grams': formatGrams(0.1)})
                        : '${tr('gold.card_hint', {
                                'grams': formatGrams(q.minStepGrams)
                              })} · ${formatMNT(q.amountFor(q.minStepGrams))}',
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

/// Алтан эдлэлийн дэлгэрэнгүй: өнөөдрийн ханш, 1 гр үнэ, алхам, өдрийн
/// граммын сонголт бүрээр төлбөр ба ойролцоо хоног, ханшийн тайлбар.
class _GoldPlanInfoCard extends StatelessWidget {
  final Product product;
  final GoldQuote? quote;
  const _GoldPlanInfoCard({required this.product, required this.quote});

  @override
  Widget build(BuildContext context) {
    final q = quote;
    final totalCg = (product.totalGrams * 100).round();
    final options = <double>[0.1, 0.2, 0.3, 0.5, 1.0]
        .where((g) => (g * 100).round() < totalCg)
        .toList();
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('gold.plan_title'), style: AppText.sectionTitle),
          const SizedBox(height: 8),
          if (q == null)
            Text(tr('gold.quote_loading'), style: AppText.caption)
          else ...[
            AppInfoRow(
              icon: Icons.trending_up_rounded,
              label: tr('gold.today_rate'),
              value: formatMNT(q.rate),
            ),
            AppInfoRow(
              icon: Icons.sell_outlined,
              label: tr('gold.price_per_gram_short'),
              value: formatMNT(q.pricePerGram),
              valueColor: CustomColors.accent,
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                tr('gold.price_formula_hint', {
                  'rate': formatMNT(q.rate),
                  'tax': q.taxPercent == q.taxPercent.roundToDouble()
                      ? q.taxPercent.toInt()
                      : q.taxPercent,
                  'labor': formatMNT(q.laborPerGram),
                }),
                style: AppText.caption.copyWith(fontSize: 11),
              ),
            ),
            AppInfoRow(
              icon: Icons.straighten_outlined,
              label: tr('gold.min_step'),
              value: formatGrams(q.minStepGrams),
            ),
            const AppDivider(),
            Text(tr('gold.options_title'), style: AppText.caption),
            const SizedBox(height: 6),
            for (final g in options)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    Icon(Icons.circle, size: 6, color: CustomColors.accent),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        tr('gold.option_row', {
                          'grams': formatGrams(g),
                          'amount': formatMNT(q.amountFor(g)),
                          'days': (totalCg / (g * 100).round()).ceil(),
                        }),
                        style: AppText.body.copyWith(fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            Text(tr('gold.rate_note'), style: AppText.caption),
          ],
        ],
      ),
    );
  }
}
