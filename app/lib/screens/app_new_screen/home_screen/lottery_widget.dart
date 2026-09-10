import 'dart:math';
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
import 'package:onegrgold/screens/app_new_screen/products_screen/purchase_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/bloc/bottom_navbar_bloc.dart';
import 'package:onegrgold/style/app_text.dart';
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
          .limit(5)
          .get();

      // Current-schema campaigns render as the full-width home banner; this
      // half-width card only ever served the two legacy ones, so showing a new
      // campaign here as well would put it on screen twice.
      final legacyDocs =
          snapshot.docs.where((d) => d.data()['schema_version'] != 2).toList();
      if (legacyDocs.isNotEmpty) {
        final data = legacyDocs.first.data();
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

    final double cardWidth = MediaQuery.of(context).size.width / 2 - 24;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
          child: Text(
            tr('home.promotion'),
            style: AppText.sectionTitle.copyWith(fontSize: 14.0),
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
                width: cardWidth,
                height: 240,
                padding: const EdgeInsets.all(12.0),
                // Same surface card as the rate card beside it in the row.
                decoration: BoxDecoration(
                  color: CustomColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      width: 1.0, color: CustomColors.surfaceBorder),
                  boxShadow: [
                    BoxShadow(
                      color: CustomColors.accent.withOpacity(0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Lottie.asset('assets/icons/clock.json',
                            width: 20, height: 20),
                        const SizedBox(width: 4.0),
                        Flexible(
                          child: Text(
                            _endDate != null
                                ? tr('home.days_left', {
                                    'days': _endDate!
                                        .difference(DateTime.now())
                                        .inDays
                                  })
                                : "COMING SOON...",
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.caption.copyWith(
                              fontSize: 9.5,
                              fontFamily: AppText.bold,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Center(
                      child: SizedBox(
                          height: 100,
                          child: Lottie.asset('assets/icons/golden_ticket.json',
                              repeat: false)),
                    ),
                    const SizedBox(height: 8.0),
                    // Ticket count pill — accent text on the soft accent tint.
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: CustomColors.accentSoft,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: Text(
                                tr('home.total_tickets'),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.label.copyWith(
                                  fontFamily: AppText.bold,
                                  fontWeight: FontWeight.bold,
                                  color: CustomColors.accent,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              '$_ticketCount',
                              style: AppText.bodyBold.copyWith(
                                fontSize: 13,
                                color: CustomColors.accent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12.0),
                    Text(
                      _name ?? "",
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: AppText.bodyBold.copyWith(fontSize: 12.0),
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

/// "Хувааж ав" promo block shown in place of the lottery card when there is
/// no active marketing campaign. Sized to the same half-width / 240-height
/// slot, with a horizontal slider of products inside.
class _ProductsPromo extends StatelessWidget {
  /// Барааг санамсаргүй холих seed — апп нээх бүрд шинээр сонгогдоно
  static final int _seed = Random().nextInt(1 << 30);

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
        // Хамгийн бага өдрийн төлбөр — "…-өөс" гэж харуулна
        num? minDaily;
        for (final p in products) {
          final d = dailyAmount(p.price, p.maxMonths.clamp(1, 12));
          if (minDaily == null || d < minDaily) minDaily = d;
        }
        // Санамсаргүй 4 бараа — seed нь сессийн турш тогтмол тул stream
        // дахин ажиллах, scroll хийхэд зураг солигдохгүй
        final shuffled = [...products]..shuffle(Random(_ProductsPromo._seed));
        final covers = shuffled.take(4).map((p) => p.coverImage).toList();
        final int extra = products.length - 4;

        // Дэлгэрэнгүй биш — доод nav-ийн "Бүтээгдэхүүн" таб руу шууд шилжинэ
        void openProducts() => BottomNavBarBloc.current?.pickItem(2);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
              child: Text(
                tr('home.installment_title'),
                style: AppText.sectionTitle.copyWith(fontSize: 14.0),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: GestureDetector(
                onTap: products.isEmpty ? null : openProducts,
                child: Container(
                  width: cardWidth,
                  height: 240,
                  padding: const EdgeInsets.all(12.0),
                  decoration: BoxDecoration(
                    color: CustomColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        width: 1.0, color: CustomColors.surfaceBorder),
                    boxShadow: [
                      BoxShadow(
                        color: CustomColors.accent.withOpacity(0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: products.isEmpty
                      ? Center(
                          child: Text(
                            tr('home.no_products'),
                            style: AppText.caption,
                          ),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 2×2 коллаж — олон бараа байгааг мэдрүүлнэ
                            Expanded(
                              child: Column(
                                children: [
                                  Expanded(
                                    child: Row(children: [
                                      Expanded(child: _tile(covers, 0)),
                                      const SizedBox(width: 6),
                                      Expanded(child: _tile(covers, 1)),
                                    ]),
                                  ),
                                  const SizedBox(height: 6),
                                  Expanded(
                                    child: Row(children: [
                                      Expanded(child: _tile(covers, 2)),
                                      const SizedBox(width: 6),
                                      Expanded(
                                          child: _tile(covers, 3,
                                              extra: extra > 0 ? extra : 0)),
                                    ]),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: CustomColors.accentSoft,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    tr('home.products_count',
                                        {'n': products.length}),
                                    style: TextStyle(
                                      fontFamily: AppText.bold,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: CustomColors.accent,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: CustomColors.surfaceAlt,
                                  ),
                                  child: const Icon(
                                      Ionicons.arrow_forward_outline,
                                      size: 14,
                                      color: Colors.white),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            if (minDaily != null)
                              Text(
                                tr('home.daily_from',
                                    {'amount': formatMNT(minDaily)}),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.caption.copyWith(
                                    fontSize: 11, color: Colors.white70),
                              ),
                          ],
                        ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Коллажийн нэг нүд: зураг, байхгүй бол бүдэг icon; сүүлийнх дээр "+N"
  Widget _tile(List<String?> covers, int i, {int extra = 0}) {
    final String? cover = i < covers.length ? covers[i] : null;
    Widget img = Container(
      color: CustomColors.surfaceAlt,
      child: cover != null
          ? Image.network(
              cover,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Center(
                child: Icon(Icons.image_not_supported_outlined,
                    color: Colors.white24, size: 18),
              ),
            )
          : const Center(
              child: Icon(Icons.inventory_2_outlined,
                  color: Colors.white24, size: 18),
            ),
    );
    if (extra > 0) {
      img = Stack(
        fit: StackFit.expand,
        children: [
          img,
          Container(
            color: Colors.black.withOpacity(0.55),
            child: Center(
              child: Text(
                "+$extra",
                style: const TextStyle(
                  fontFamily: AppText.bold,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      );
    }
    return ClipRRect(borderRadius: BorderRadius.circular(10), child: img);
  }
}

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
            style: AppText.sectionTitle.copyWith(fontSize: 14.0),
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
                color: CustomColors.surface,
                borderRadius: BorderRadius.circular(16),
                border:
                    Border.all(width: 1.0, color: CustomColors.surfaceBorder),
                boxShadow: [
                  BoxShadow(
                    color: CustomColors.accent.withOpacity(0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
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
                          color: CustomColors.surfaceAlt,
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
                      style: AppText.bodyBold.copyWith(fontSize: 11),
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: purchase.totalDays > 0
                            ? purchase.paidDays / purchase.totalDays
                            : 0,
                        minHeight: 5,
                        backgroundColor: Colors.white.withOpacity(0.08),
                        valueColor: AlwaysStoppedAnimation<Color>(
                            CustomColors.accent),
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
                          style: AppText.caption.copyWith(fontSize: 9.5),
                        ),
                        Text(
                          '${pct.toStringAsFixed(pct < 10 ? 1 : 0)}%',
                          style: TextStyle(
                            fontFamily: AppText.bold,
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            color: CustomColors.accent,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Compact accent pill — the card is too small for the
                    // full-height primary button.
                    Container(
                      height: 30,
                      width: double.infinity,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: CustomColors.accent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        purchase.hasPendingCancelRequest
                            ? tr('home.view_details')
                            : tr('home.make_next_payment'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.button.copyWith(fontSize: 11),
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
