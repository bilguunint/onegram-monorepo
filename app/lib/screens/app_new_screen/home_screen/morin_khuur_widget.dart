import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:rainbow_edge_lighting/rainbow_edge_lighting.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_detail_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Users for whom the donation campaign is hidden (they see the loan service).
const Set<String> _kHiddenCampaignUids = {'user_3380'};

/// Gold shimmer for the animated card edge (loops seamlessly) — derived from
/// the accent so the card reads as part of the dark-gold system.
const List<Color> _kEdgeColors = [
  Color(0xFFF6B800), // accent
  Color(0xFFFFE08A), // pale gold highlight
  Color(0xFFF6B800), // accent
  Color(0x33F6B800), // fades out
  Color(0xFFF6B800), // accent (loop)
];

/// Нүүрний "Дэлхийн морин хуурын төв цогцолбор" хандивын аяны бүтэн өргөнтэй
/// banner. Аян `active` биш эсвэл ачаалж байх үед огт зай эзлэхгүй; идэвхтэй
/// үед зүүн талд cover зураг, баруун талд нэр, тарьсан мод, дэмжигчдийн тоо.
class MorinKhuurWidget extends StatefulWidget {
  const MorinKhuurWidget({super.key});

  @override
  State<MorinKhuurWidget> createState() => _MorinKhuurWidgetState();
}

class _MorinKhuurWidgetState extends State<MorinKhuurWidget> {
  bool _loading = true;
  bool _active = false;

  /// Firestore-supplied name; null means fall back to the translated
  /// default at build time rather than freezing it here.
  String? _name;
  String? _coverImage;
  int _donorCount = 0;
  int _treeCount = 0;

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

      if (!mounted) return;
      setState(() {
        _name = data['name'] as String?;
        _coverImage = data['cover_image'] as String?;
        _donorCount = (data['donor_count'] as num?)?.toInt() ?? 0;
        _treeCount = (data['tree_count'] as num?)?.toInt() ?? 0;
        _active = true;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Аян идэвхгүй үед юу ч харуулахгүй
    if (_loading || !_active) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Text(
              tr('home.support_campaign'),
              style: AppText.sectionTitle.copyWith(fontSize: 14.0),
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
              radius: 20,
              thickness: 0.5,
              speed: 0.5,
              colors: _kEdgeColors,
              child: Container(
                height: 112,
                decoration: BoxDecoration(
                  color: CustomColors.surface,
                  borderRadius: BorderRadius.circular(20),
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
                child: Row(
                  children: [
                    // Зүүн: cover зураг
                    SizedBox(
                      width: 128,
                      height: double.infinity,
                      child: _cover(),
                    ),
                    // Баруун: нэр + статистик
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _name ?? tr('home.morin_khuur_center_name'),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.bodyBold
                                  .copyWith(fontSize: 12.5, height: 1.25),
                            ),
                            const SizedBox(height: 10),
                            _stats(),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(right: 10.0),
                      child: Icon(Icons.chevron_right_rounded,
                          size: 22, color: CustomColors.accent),
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
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [CustomColors.surfaceAlt, CustomColors.surface],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.account_balance_rounded,
          size: 40,
          color: CustomColors.accent.withOpacity(0.45),
        ),
      ),
    );
  }

  Widget _stats() {
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stat(Icons.park_rounded, '$_treeCount', tr('home.trees_label')),
          const SizedBox(width: 12),
          _stat(Icons.volunteer_activism_rounded, '$_donorCount',
              tr('home.supporters_label')),
        ],
      ),
    );
  }

  Widget _stat(IconData icon, String value, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: CustomColors.accent),
        const SizedBox(width: 4),
        Text(value, style: AppText.bodyBold.copyWith(fontSize: 12.5)),
        const SizedBox(width: 3),
        Text(label, style: AppText.caption.copyWith(fontSize: 10.5)),
      ],
    );
  }
}
