import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/my_purchases_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/pickup_ready_view.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_card_widget.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_detail_screen.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class ProductsScreen extends StatefulWidget {
  final String uid;
  final UserRepository userRepository;

  const ProductsScreen({
    super.key,
    required this.uid,
    required this.userRepository,
  });

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final ProductRepository _repo = ProductRepository();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      body: SafeArea(
        bottom: false,
        child: StreamBuilder<ProductPurchase?>(
          stream: _repo.watchMyActiveInstallment(widget.uid),
          builder: (context, activeSnapshot) {
            if (activeSnapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CupertinoActivityIndicator());
            }

            final activePurchase = activeSnapshot.data;

            // When the user already has an active installment we hide the
            // catalog grid entirely and show the full purchase detail. This
            // keeps the user focused on completing their current commitment
            // before browsing for more.
            if (activePurchase != null) {
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    child: _TitleRow(onMyPurchases: _openMyPurchases),
                  ),
                  Expanded(child: PurchaseDetailView(purchase: activePurchase)),
                ],
              );
            }

            return StreamBuilder<ProductPurchase?>(
              stream: _repo.watchMyPickupReadyPurchase(widget.uid),
              builder: (context, pickupSnapshot) {
                if (pickupSnapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CupertinoActivityIndicator());
                }
                // A fully-paid (pickup-ready) purchase no longer hides the
                // catalog — it becomes a banner above the grid so the user can
                // keep browsing and start their next purchase right away.
                final pickup = pickupSnapshot.data;
                return Column(
                  children: [
                    if (pickup != null) _PickupReadyBanner(purchase: pickup),
                    Expanded(
                      child: _ProductsGrid(
                        repo: _repo,
                        uid: widget.uid,
                        userRepository: widget.userRepository,
                      ),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }

  void _openMyPurchases() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => MyPurchasesScreen(uid: widget.uid)),
    );
  }
}

class _ProductsGrid extends StatelessWidget {
  final ProductRepository repo;
  final String uid;
  final UserRepository userRepository;

  const _ProductsGrid({
    required this.repo,
    required this.uid,
    required this.userRepository,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Product>>(
      stream: repo.watchActiveProducts(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CupertinoActivityIndicator());
        }

        if (snapshot.hasError) {
          final err = snapshot.error;
          final stack = snapshot.stackTrace;
          debugPrint('[ProductsScreen] watchActiveProducts error: $err');
          if (stack != null) {
            debugPrintStack(stackTrace: stack);
          }
          FlutterError.reportError(FlutterErrorDetails(
            exception: err ?? 'Unknown error',
            stack: stack,
            library: 'ProductsScreen',
            context: ErrorDescription('watchActiveProducts stream'),
          ));
          return _ErrorState(message: '$err');
        }

        final products = snapshot.data ?? const <Product>[];

        if (products.isEmpty) {
          return const _EmptyState();
        }

        num? minDaily;
        for (final p in products) {
          final d = dailyAmount(p.price, p.maxMonths.clamp(1, 12));
          if (minDaily == null || d < minDaily) minDaily = d;
        }
        return CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              sliver: SliverToBoxAdapter(
                child: _CatalogHeader(
                  count: products.length,
                  minDaily: minDaily,
                  onMyPurchases: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => MyPurchasesScreen(uid: uid),
                    ),
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12.0,
                  crossAxisSpacing: 12.0,
                  // Зураг + 2 мөр нэр + үнэ + өдрийн chip багтах өндөр
                  childAspectRatio: 0.62,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final product = products[index];
                    return ProductCardWidget(
                      product: product,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProductDetailScreen(
                              product: product,
                              uid: uid,
                              userRepository: userRepository,
                            ),
                          ),
                        );
                      },
                    );
                  },
                  childCount: products.length,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Каталогийн толгой: барааны тоо + хамгийн бага өдрийн төлбөр
class _TitleRow extends StatelessWidget {
  final VoidCallback onMyPurchases;
  const _TitleRow({required this.onMyPurchases});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(tr('home.installment_title'), style: AppText.appBarTitle),
        ),
        Tooltip(
          message: tr('purchase.my_purchases'),
          child: InkWell(
            onTap: onMyPurchases,
            borderRadius: BorderRadius.circular(12),
            child: AppIconTile(
              size: 40,
              child: SvgPicture.asset(
                'assets/icons/invoice.svg',
                height: 18,
                colorFilter:
                    const ColorFilter.mode(Colors.white, BlendMode.srcIn),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CatalogHeader extends StatelessWidget {
  final int count;
  final num? minDaily;
  final VoidCallback onMyPurchases;
  const _CatalogHeader(
      {required this.count,
      required this.minDaily,
      required this.onMyPurchases});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 8),
        _TitleRow(onMyPurchases: onMyPurchases),
        const SizedBox(height: 10),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              decoration: BoxDecoration(
                color: CustomColors.accentSoft,
                borderRadius: BorderRadius.circular(9),
              ),
              child: Text(
                tr('home.products_count', {'n': count}),
                style: TextStyle(
                  fontFamily: AppText.bold,
                  fontSize: 11.5,
                  fontWeight: FontWeight.bold,
                  color: CustomColors.accent,
                ),
              ),
            ),
            const SizedBox(width: 10),
            if (minDaily != null)
              Flexible(
                child: Text(
                  tr('home.daily_from', {'amount': formatMNT(minDaily!)}),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return AppEmptyState(
      icon: Icons.inventory_2_outlined,
      title: tr('purchase.no_products'),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return AppEmptyState(
      icon: Icons.error_outline_rounded,
      iconColor: CustomColors.negative,
      title: tr('purchase.products_load_error'),
      subtitle: message,
    );
  }
}

/// Compact banner shown above the catalog while a fully-paid purchase waits
/// to be picked up. Tapping opens the full pickup screen (code + store info)
/// — the catalog itself stays browsable so the user can start a new purchase.
class _PickupReadyBanner extends StatelessWidget {
  final ProductPurchase purchase;
  const _PickupReadyBanner({required this.purchase});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: AppBanner(
        icon: Icons.celebration_rounded,
        title: tr('purchase.pickup_ready'),
        text: tr('purchase.view_pickup_code',
            {'product': purchase.productSnapshot.name}),
        trailing: Icon(Icons.chevron_right_rounded,
            size: 20, color: CustomColors.accent),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => Scaffold(
                backgroundColor: CustomColors.appBackground,
                appBar: appBar(tr('purchase.pickup_ready')),
                body: PickupReadyView(purchase: purchase),
              ),
            ),
          );
        },
      ),
    );
  }
}
