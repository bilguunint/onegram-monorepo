import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/my_purchases_screen.dart';
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
          title: const Text(
            "Бүтээгдэхүүн",
            style: TextStyle(
              fontFamily: "InterBold",
              fontSize: 12,
              color: Colors.white,
            ),
          ),
          centerTitle: false,
          actions: [
            IconButton(
              tooltip: 'Миний худалдан авалт',
              icon: const Icon(
                Icons.receipt_long_outlined,
                color: Colors.white,
                size: 22,
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

          return StreamBuilder<List<Product>>(
            stream: _repo.watchActiveProducts(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CupertinoActivityIndicator());
              }

              if (snapshot.hasError) {
                final err = snapshot.error;
                final stack = snapshot.stackTrace;
                // Surface the full error (incl. Firestore index-creation URL)
                // to the console so the developer can click it and provision
                // the index. The UI shows the same message for visibility.
                debugPrint(
                    '[ProductsScreen] watchActiveProducts error: $err');
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
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12.0,
                  crossAxisSpacing: 12.0,
                  childAspectRatio: 0.72,
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
                            uid: widget.uid,
                            userRepository: widget.userRepository,
                          ),
                        ),
                      );
                    },
                  );
                },
              );
            },
          );
        },
      ),
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
          const Text(
            'Одоогоор бүтээгдэхүүн алга',
            style: TextStyle(
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
            const Text(
              'Бүтээгдэхүүн ачаалахад алдаа гарлаа',
              style: TextStyle(
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
