import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/lottery_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

class LotteryWidget extends StatefulWidget {
  /// Optional context for the products-slider fallback shown when no
  /// marketing campaign is active. Without these, the widget renders
  /// [SizedBox.shrink] in the no-campaign state.
  final String? uid;
  final UserRepository? userRepository;

  const LotteryWidget({
    super.key,
    this.uid,
    this.userRepository,
  });

  @override
  State<LotteryWidget> createState() => _LotteryWidgetState();
}

class _LotteryWidgetState extends State<LotteryWidget> {
  final ProductRepository _productRepo = ProductRepository();
  String? _name;
  String? _description;
  DateTime? _endDate;
  int _ticketCount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchActiveCampaign();
    _fetchTicketCount();
  }

  Future<void> _fetchActiveCampaign() async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('marketing_campaigns')
          .where('status', isEqualTo: 'active')
          .limit(1)
          .get();

      if (snapshot.docs.isNotEmpty) {
        final data = snapshot.docs.first.data();
        setState(() {
          _name = data['name'] as String?;
          _description = data['description'] as String?;
          _endDate = (data['end_date'] as Timestamp?)?.toDate();
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchTicketCount() async {
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) return;
      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .collection('lottery_tickets')
          .count()
          .get();
      setState(() {
        _ticketCount = snapshot.count ?? 0;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox.shrink();
    }
    if (_name == null) {
      // No active campaign — fall back to the "Хувааж ав" products slider in
      // the same half-width slot.
      if (widget.uid != null && widget.userRepository != null) {
        return _ProductsPromo(
          uid: widget.uid!,
          userRepository: widget.userRepository!,
          repo: _productRepo,
        );
      }
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
          child: Text(
            tr('home.promotion'),
            style: const TextStyle(
              fontFamily: "InterBold",
              fontSize: 14.0,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 0.0, horizontal: 16.0),
          child: Center(
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LotteryDetailScreen(
                      name: _name!,
                      description: _description,
                      endDate: _endDate,
                    ),
                  ),
                );
              },
              child: Container(
                width: MediaQuery.of(context).size.width / 2 - 24,
                height: 240,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color.fromARGB(255, 13, 17, 21),
                      Color.fromARGB(255, 15, 17, 20),
                      Color.fromARGB(255, 9, 19, 28),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                      offset: const Offset(0, 10),
                    ),
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 40,
                      spreadRadius: 0,
                      offset: const Offset(0, 20),
                    ),
                  ],
                  border: Border.all(
                    color: const Color(0xFF455A64),
                    width: 2,
                  ),
                ),
                child: Stack(
                  children: [
                    Container(
                      width: MediaQuery.of(context).size.width / 2 - 24,
                      height: 240,
                      padding: const EdgeInsets.all(16.0),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color.fromARGB(255, 13, 17, 21),
                            Color.fromARGB(255, 15, 17, 20),
                            Color.fromARGB(255, 9, 19, 28),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    /* Positioned(
              left: 0.0,
              right: 0.0,
              top: 10.0,
              child: SizedBox(
              height: 120,
              child: Image.asset('assets/images/goldbar_black.png'))), */
                    Positioned(
                      right: 10.0,
                      top: 10.0,
                      child: Row(
                        children: [
                          Lottie.asset('assets/icons/clock.json',
                              width: 20, height: 20),
                          SizedBox(width: 4.0),
                          Text(
                            _endDate != null
                                ? tr('home.days_left', {
                                    'days': _endDate!
                                        .difference(DateTime.now())
                                        .inDays
                                  })
                                : "COMING SOON...",
                            style: const TextStyle(
                              fontSize: 9.0,
                              fontWeight: FontWeight.bold,
                              color: Colors.white54,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                        bottom: 20.0,
                        right: 16.0,
                        left: 16.0,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            SizedBox(
                                height: 100,
                                child: Lottie.asset(
                                    'assets/icons/golden_ticket.json',
                                    repeat: false)),
                            Container(
                              width: 150.0,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.white24,
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    tr('home.total_tickets'),
                                    style: TextStyle(
                                        color: CustomColors.mainColor,
                                        fontSize: 12,
                                        fontFamily: "RubikBold"),
                                  ),
                                  SizedBox(width: 16),
                                  Text(
                                    '$_ticketCount',
                                    style: TextStyle(
                                        color: CustomColors.mainColor,
                                        fontSize: 12,
                                        fontFamily: "RubikBold"),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16.0),
                            Text(
                              _name ?? "",
                              style: TextStyle(
                                  fontSize: 12.0,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white),
                            ),
                          ],
                        )),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// "Хувааж ав" promo block shown in place of the lottery card when there is
/// no active marketing campaign. Sized to the same half-width / 240-height
/// slot, with a horizontal slider of products inside.
class _ProductsPromo extends StatelessWidget {
  final String uid;
  final UserRepository userRepository;
  final ProductRepository repo;

  const _ProductsPromo({
    required this.uid,
    required this.userRepository,
    required this.repo,
  });

  @override
  Widget build(BuildContext context) {
    final cardWidth = MediaQuery.of(context).size.width / 2 - 24;
    // With an ACTIVE installment the slot becomes "my installment" — progress
    // + next-payment shortcut — instead of the products slider.
    return StreamBuilder<ProductPurchase?>(
      stream: repo.watchMyActiveInstallment(uid),
      builder: (context, activeSnap) {
        final active = activeSnap.data;
        if (active != null) {
          return _ActiveInstallmentPromo(
            purchase: active,
            cardWidth: cardWidth,
          );
        }
        return _productsSlider(context, cardWidth);
      },
    );
  }

  Widget _productsSlider(BuildContext context, double cardWidth) {
    return StreamBuilder<List<Product>>(
      stream: repo.watchActiveProducts(),
      builder: (context, snapshot) {
        final products = snapshot.data ?? const <Product>[];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
              child: Text(
                tr('home.installment_title'),
                style: const TextStyle(
                  fontFamily: 'InterBold',
                  fontSize: 14.0,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                width: cardWidth,
                height: 240,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color.fromARGB(255, 13, 17, 21),
                      Color.fromARGB(255, 15, 17, 20),
                      Color.fromARGB(255, 9, 19, 28),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF455A64),
                    width: 0.5,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: products.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(
                            tr('home.no_products'),
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      )
                    : PageView.builder(
                        controller: PageController(viewportFraction: 1.0),
                        itemCount: products.length,
                        itemBuilder: (context, i) {
                          return _PromoSlide(
                            product: products[i],
                            current: i + 1,
                            total: products.length,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ProductDetailScreen(
                                    product: products[i],
                                    uid: uid,
                                    userRepository: userRepository,
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _PromoSlide extends StatelessWidget {
  final Product product;
  final int current;
  final int total;
  final VoidCallback onTap;

  const _PromoSlide({
    required this.product,
    required this.current,
    required this.total,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cover = product.coverImage;
    final maxMonths = product.maxMonths.clamp(1, 12);
    final daily = dailyAmount(product.price, maxMonths);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Stack(
        children: [
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        width: double.infinity,
                        color: const Color(0xFF252528),
                        child: cover != null
                            ? Image.network(
                                cover,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Center(
                                  child: Icon(
                                    Icons.image_not_supported_outlined,
                                    color: Colors.white24,
                                    size: 28,
                                  ),
                                ),
                              )
                            : const Center(
                                child: Icon(
                                  Icons.inventory_2_outlined,
                                  color: Colors.white24,
                                  size: 30,
                                ),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tr('home.daily_amount', {'amount': formatMNT(daily)}),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: CustomColors.mainColor,
                      fontFamily: 'RubikBold',
                      fontSize: 11.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (total > 1)
            Positioned(
              top: 8,
              right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$current/$total',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Home-slot card shown instead of the products slider while the user has an
/// ACTIVE installment: cover, progress and a next-payment shortcut. Tapping
/// opens the full purchase detail where the next day(s) can be paid.
class _ActiveInstallmentPromo extends StatelessWidget {
  final ProductPurchase purchase;
  final double cardWidth;

  const _ActiveInstallmentPromo({
    required this.purchase,
    required this.cardWidth,
  });

  @override
  Widget build(BuildContext context) {
    final ps = purchase.productSnapshot;
    final pct = purchase.totalDays > 0
        ? (purchase.paidDays / purchase.totalDays * 100).clamp(0, 100)
        : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
          child: Text(
            tr('home.my_installment'),
            style: const TextStyle(
              fontFamily: 'InterBold',
              fontSize: 14.0,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => PurchaseDetailScreen(purchase: purchase),
                ),
              );
            },
            child: Container(
              width: cardWidth,
              height: 240,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color.fromARGB(255, 13, 17, 21),
                    Color.fromARGB(255, 15, 17, 20),
                    Color.fromARGB(255, 9, 19, 28),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF455A64),
                  width: 0.5,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          width: double.infinity,
                          color: const Color(0xFF252528),
                          child: ps.image != null
                              ? Image.network(
                                  ps.image!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Center(
                                    child: Icon(
                                      Icons.image_not_supported_outlined,
                                      color: Colors.white24,
                                      size: 28,
                                    ),
                                  ),
                                )
                              : const Center(
                                  child: Icon(
                                    Icons.inventory_2_outlined,
                                    color: Colors.white24,
                                    size: 30,
                                  ),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      ps.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: purchase.totalDays > 0
                            ? purchase.paidDays / purchase.totalDays
                            : 0,
                        minHeight: 5,
                        backgroundColor: Colors.white.withOpacity(0.15),
                        valueColor: AlwaysStoppedAnimation<Color>(
                            CustomColors.mainColor),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          tr('home.days_progress', {
                            'paid': purchase.paidDays,
                            'total': purchase.totalDays
                          }),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 9.5,
                          ),
                        ),
                        Text(
                          '${pct.toStringAsFixed(pct < 10 ? 1 : 0)}%',
                          style: TextStyle(
                            color: CustomColors.mainColor,
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 30,
                      width: double.infinity,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: CustomColors.mainColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        purchase.hasPendingCancelRequest
                            ? tr('home.view_details')
                            : tr('home.make_next_payment'),
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
