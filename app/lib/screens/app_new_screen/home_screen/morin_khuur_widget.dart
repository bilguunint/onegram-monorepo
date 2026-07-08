import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:rainbow_edge_lighting/rainbow_edge_lighting.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/lease_gold_widget.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

/// Users for whom the donation campaign is hidden (they see the loan service).
const Set<String> _kHiddenCampaignUids = {'user_3380'};

/// Burning-fire palette for the animated card edge (loops seamlessly).
const List<Color> _kFireColors = [
  Color(0xFFFF2D00), // red-orange
  Color(0xFFFF5722), // deep orange
  Color(0xFFFF9100), // orange
  Color(0xFFFFC107), // amber
  Color(0xFFFFEB3B), // hot yellow core
  Color(0xFFFF9100), // orange
  Color(0xFFFF2D00), // red-orange (loop)
];

/// Home-screen card for the "Дэлхийн морин хуурын төв цогцолбор" fundraising
/// campaign. It occupies the SAME half-width / 240-height slot as
/// [LeaseGoldWidget] in the services row.
///
/// While loading or when no campaign is `active`, it transparently renders the
/// original [LeaseGoldWidget] (the loan service), so the slot is never empty.
/// When a campaign is active it shows the campaign cover with title, progress,
/// product count and donor count.
class MorinKhuurWidget extends StatefulWidget {
  const MorinKhuurWidget({super.key});

  @override
  State<MorinKhuurWidget> createState() => _MorinKhuurWidgetState();
}

class _MorinKhuurWidgetState extends State<MorinKhuurWidget> {
  bool _loading = true;
  bool _active = false;

  String _name = '';
  String? _coverImage;
  num _targetAmount = 0;
  num _totalRaised = 0;
  int _donorCount = 0;
  int _productCount = 0;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      // Hide the campaign for specific users → fall back to the loan service.
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid != null && _kHiddenCampaignUids.contains(uid)) {
        if (mounted) setState(() => _loading = false);
        return;
      }

      final doc = await FirebaseFirestore.instance
          .collection('center_campaign')
          .doc('main')
          .get();

      final data = doc.data();
      if (data == null || (data['status'] as String?) != 'active') {
        if (mounted) setState(() => _loading = false);
        return;
      }

      int productCount = 0;
      try {
        final agg = await FirebaseFirestore.instance
            .collection('center_products')
            .where('status', isEqualTo: 'active')
            .count()
            .get();
        productCount = agg.count ?? 0;
      } catch (_) {}

      if (!mounted) return;
      setState(() {
        _name =
            (data['name'] as String?) ?? 'Дэлхийн морин хуурын төв цогцолбор';
        _coverImage = data['cover_image'] as String?;
        _targetAmount = (data['target_amount'] as num?) ?? 0;
        _totalRaised = (data['total_raised'] as num?) ?? 0;
        _donorCount = (data['donor_count'] as num?)?.toInt() ?? 0;
        _productCount = productCount;
        _active = true;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // No active campaign → fall back to the original loan-service card.
    if (_loading || !_active) {
      return const Padding(
        padding: EdgeInsets.only(left: 16),
        child: LeaseGoldWidget(),
      );
    }

    final double cardWidth = MediaQuery.of(context).size.width / 2 - 24;
    final double percent = _targetAmount > 0
        ? (_totalRaised / _targetAmount * 100).clamp(0, 100).toDouble()
        : 0;

    return Padding(
      padding: const EdgeInsets.only(left: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 16.0, bottom: 16.0),
            child: Text(
              'Дэмжлэгт аян',
              style: TextStyle(
                fontFamily: 'InterBold',
                fontSize: 14.0,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const CenterDetailScreen(),
                ),
              );
            },
            child: RainbowEdgeLighting(
              radius: 16,
              thickness: 0.5,
              speed: 0.5,
              colors: _kFireColors,
              child: Container(
                width: cardWidth,
                height: 240,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: Colors.white.withOpacity(0.08), width: 0.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.30),
                      blurRadius: 20,
                      spreadRadius: 5,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _cover(),
                    // Legibility gradient — bright image, dark only behind text.
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.10),
                              Colors.black.withOpacity(0.82),
                            ],
                            stops: const [0.0, 0.40, 1.0],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 12,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontFamily: 'InterBold',
                              fontWeight: FontWeight.w800,
                              fontSize: 10.0,
                              height: 1.15,
                              shadows: [
                                Shadow(blurRadius: 6, color: Colors.black87),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          _progress(percent),
                          const SizedBox(height: 8),
                          _stats(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _cover() {
    final cover = _coverImage;
    if (cover != null && cover.isNotEmpty) {
      return Image.network(
        cover,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return _coverFallback();
        },
        errorBuilder: (_, __, ___) => _coverFallback(),
      );
    }
    return _coverFallback();
  }

  Widget _coverFallback() {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.fromARGB(255, 13, 17, 21),
            Color.fromARGB(255, 15, 17, 20),
            Color.fromARGB(255, 9, 19, 28),
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.account_balance_rounded,
          size: 40,
          color: CustomColors.mainColor.withOpacity(0.45),
        ),
      ),
    );
  }

  Widget _progress(double percent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          formatMNT(_totalRaised),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: CustomColors.mainColor,
            fontFamily: 'RubikBold',
            fontSize: 10.5,
          ),
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: percent / 100,
            minHeight: 5,
            backgroundColor: Colors.white.withOpacity(0.22),
            valueColor: AlwaysStoppedAnimation<Color>(CustomColors.mainColor),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          '${percent.toStringAsFixed(percent < 10 ? 1 : 0)}% биелсэн',
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 9.0,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _stats() {
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stat(Icons.workspace_premium_rounded, '$_productCount', 'бараа'),
          const SizedBox(width: 12),
          _stat(Icons.volunteer_activism_rounded, '$_donorCount', 'дэмжигч'),
        ],
      ),
    );
  }

  Widget _stat(IconData icon, String value, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: CustomColors.mainColor),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11.0,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 9.5,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
