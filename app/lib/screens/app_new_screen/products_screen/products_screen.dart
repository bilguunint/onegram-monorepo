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
      backgroundColor: CustomColors.darkContainerColor,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(45.0),
        child: AppBar(
          backgroundColor: CustomColors.darkContainerColor,
          title: Text(
            tr('purchase.products_title'),
            style: const TextStyle(
              fontFamily: "InterBold",
              fontSize: 12,
              color: Colors.white,
            ),
          ),
          centerTitle: false,
          actions: [
            IconButton(
              tooltip: tr('purchase.my_purchases'),
              icon: SvgPicture.asset(
                'assets/icons/invoice.svg',
                colorFilter: const ColorFilter.mode(
                  Colors.white,
                  BlendMode.srcIn,
                ),
              ),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => MyPurchasesScreen(uid: widget.uid),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      body: StreamBuilder<ProductPurchase?>(
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
            return PurchaseDetailView(purchase: activePurchase);
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

        return GridView.builder(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12.0,
            crossAxisSpacing: 12.0,
            // Taller cards so a 2-line title still leaves room for the price
            // and daily-amount rows below the square cover image.
            childAspectRatio: 0.65,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
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
        );
      },
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined,
              size: 56, color: Colors.white.withOpacity(0.3)),
          const SizedBox(height: 12),
          Text(
            tr('purchase.no_products'),
            style: const TextStyle(
              color: Colors.white54,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 56, color: Colors.redAccent),
            const SizedBox(height: 12),
            Text(
              tr('purchase.products_load_error'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              style: const TextStyle(color: Colors.white54, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
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
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => Scaffold(
              backgroundColor: CustomColors.darkContainerColor,
              appBar: AppBar(
                backgroundColor: CustomColors.darkContainerColor,
                iconTheme: const IconThemeData(color: Colors.white),
                title: Text(
                  tr('purchase.pickup_ready'),
                  style: const TextStyle(
                    fontFamily: 'InterBold',
                    fontSize: 13,
                    color: Colors.white,
                  ),
                ),
                centerTitle: false,
              ),
              body: PickupReadyView(purchase: purchase),
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: CustomColors.mainColor.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CustomColors.mainColor.withOpacity(0.35)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: CustomColors.mainColor.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.celebration_rounded,
                  size: 18, color: CustomColors.mainColor),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tr('purchase.pickup_ready'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tr('purchase.view_pickup_code',
                        {'product': purchase.productSnapshot.name}),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                size: 20, color: CustomColors.mainColor),
          ],
        ),
      ),
    );
  }
}
