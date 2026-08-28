import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_promo_popup.dart';
import 'package:onegrgold/style/colors.dart';

/// Molten-gold palette for the animated ticket edge (loops seamlessly).
const List<Color> _kGoldColors = [
  Color(0xFFB8860B), // dark goldenrod
  Color(0xFFFFD700), // gold
  Color(0xFFFFF3B0), // bright highlight
  Color(0xFFFCD535), // brand gold
  Color(0xFFFF9100), // amber flash
  Color(0xFFB8860B), // dark goldenrod (loop)
];

/// Where the stub is torn off, as a fraction of the card width.
const double _kTearFraction = 0.70;
const double _kCornerRadius = 16.0;
const double _kNotchRadius = 8.0;

/// The ticket outline: a rounded rectangle with two concave semicircular
/// notches punched into the top and bottom edges at the tear line. One
/// function builds it so the clip and the painted border always agree.
Path _ticketPath(Size size) {
  final w = size.width;
  final h = size.height;
  final tearX = w * _kTearFraction;
  const r = _kCornerRadius;
  const n = _kNotchRadius;

  return Path()
    ..moveTo(r, 0)
    // top edge → notch
    ..lineTo(tearX - n, 0)
    // concave half-circle dipping into the card
    ..arcToPoint(
      Offset(tearX + n, 0),
      radius: const Radius.circular(n),
      clockwise: false,
    )
    // top edge → top-right corner
    ..lineTo(w - r, 0)
    ..arcToPoint(Offset(w, r), radius: const Radius.circular(r))
    ..lineTo(w, h - r)
    ..arcToPoint(Offset(w - r, h), radius: const Radius.circular(r))
    // bottom edge → notch (mirrored)
    ..lineTo(tearX + n, h)
    ..arcToPoint(
      Offset(tearX - n, h),
      radius: const Radius.circular(n),
      clockwise: false,
    )
    ..lineTo(r, h)
    ..arcToPoint(Offset(0, h - r), radius: const Radius.circular(r))
    ..lineTo(0, r)
    ..arcToPoint(const Offset(r, 0), radius: const Radius.circular(r))
    ..close();
}

/// The "Сугалаат аян" section on the home screen: a full-width card cut in the
/// actual shape of a lottery ticket — the border itself follows the notches —
/// with an animated golden edge and a perforated stub carrying the golden
/// ticket animation and the user's own count. Occupies no space at all when no
/// current-schema campaign is active.
///
/// Also the place the campaign's promo popup fires from — once per app launch,
/// after the banner has confirmed there is something to promote.
class CampaignBannerWidget extends StatefulWidget {
  const CampaignBannerWidget({super.key});

  @override
  State<CampaignBannerWidget> createState() => _CampaignBannerWidgetState();
}

/// Once per app process, not per rebuild — the home screen is recreated on
/// every login/tab return and the popup must not follow it around.
bool _popupShownThisLaunch = false;

class _CampaignBannerWidgetState extends State<CampaignBannerWidget>
    with SingleTickerProviderStateMixin {
  LotteryCampaignInfo? _campaign;
  int _myTickets = 0;
  late final AnimationController _edge;

  @override
  void initState() {
    super.initState();
    _edge = AnimationController(vsync: this, duration: const Duration(seconds: 4))
      ..repeat();
    _load();
  }

  @override
  void dispose() {
    _edge.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final campaign = await LotteryCampaignInfo.fetchActive();
      if (!mounted || campaign == null) return;
      setState(() => _campaign = campaign);
      _maybeShowPopup(campaign);
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) return;
      final count = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .collection('lottery_tickets')
          .where('campaign_id', isEqualTo: campaign.id)
          .count()
          .get();
      if (mounted) setState(() => _myTickets = count.count ?? 0);
    } catch (_) {
      // A failed fetch just leaves the section hidden.
    }
  }

  void _maybeShowPopup(LotteryCampaignInfo campaign) {
    if (_popupShownThisLaunch || !campaign.popup.hasContent) return;
    _popupShownThisLaunch = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        showCampaignPromoPopup(context, campaign, onOpen: () => _open(campaign));
      }
    });
  }

  void _open(LotteryCampaignInfo campaign) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CampaignDetailScreen(campaignId: campaign.id),
      ),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final campaign = _campaign;
    if (campaign == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
          child: Text(
            tr('lottery.section_title'),
            style: const TextStyle(fontFamily: "InterBold", fontSize: 14.0),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: GestureDetector(
            onTap: () => _open(campaign),
            child: AspectRatio(
              aspectRatio: 21 / 9,
              child: LayoutBuilder(builder: (context, box) {
                final size = Size(box.maxWidth, box.maxHeight);
                final tearX = box.maxWidth * _kTearFraction;
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    // Content, cut to the ticket outline — notches included.
                    ClipPath(
                      clipper: _TicketClipper(),
                      child: Row(
                        children: [
                          Expanded(child: _coverSide(campaign)),
                          SizedBox(
                              width: box.maxWidth - tearX, child: _stub()),
                        ],
                      ),
                    ),
                    // Dashed tear line running notch to notch.
                    Positioned(
                      left: tearX - 0.75,
                      top: _kNotchRadius + 4,
                      bottom: _kNotchRadius + 4,
                      child: CustomPaint(
                        size: const Size(1.5, double.infinity),
                        painter: _DashedLinePainter(),
                      ),
                    ),
                    // The border strokes the same path, so the gold line dips
                    // around each notch exactly like a punched ticket.
                    IgnorePointer(
                      child: AnimatedBuilder(
                        animation: _edge,
                        builder: (_, __) => CustomPaint(
                          size: size,
                          painter: _TicketBorderPainter(t: _edge.value),
                        ),
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ),
      ],
    );
  }

  // ---- left: cover image, name, countdown --------------------------------

  Widget _coverSide(LotteryCampaignInfo campaign) {
    return Stack(
      fit: StackFit.expand,
      children: [
        _cover(campaign),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: [0.3, 1.0],
              colors: [Colors.transparent, Colors.black87],
            ),
          ),
        ),
        Positioned(
          left: 10,
          top: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: CustomColors.mainColor.withOpacity(0.5)),
            ),
            child: Text(
              campaign.daysLeft > 0
                  ? tr('lottery.days_left', {'days': campaign.daysLeft})
                  : tr('lottery.ends_today'),
              style: TextStyle(
                color: CustomColors.mainColor,
                fontSize: 9,
                fontFamily: "RubikBold",
              ),
            ),
          ),
        ),
        Positioned(
          left: 10,
          right: 10,
          bottom: 10,
          child: Text(
            campaign.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontFamily: "InterBold",
              fontSize: 14,
              height: 1.25,
              shadows: [Shadow(color: Colors.black, blurRadius: 6)],
            ),
          ),
        ),
      ],
    );
  }

  Widget _cover(LotteryCampaignInfo campaign) {
    final url = campaign.coverImage;
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, progress) =>
            progress == null ? child : _placeholder(),
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3A3110), Color(0xFF161618)],
        ),
      ),
    );
  }

  // ---- right: the ticket stub --------------------------------------------

  Widget _stub() {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF241E08), Color(0xFF14120A)],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            height: 46,
            child: Lottie.asset('assets/icons/golden_ticket.json'),
          ),
          const SizedBox(height: 2),
          Text(
            '$_myTickets',
            style: TextStyle(
              color: CustomColors.mainColor,
              fontSize: 20,
              fontFamily: "RubikBold",
              height: 1.1,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              tr('lottery.my_tickets_short'),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white54, fontSize: 8.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) => _ticketPath(size);

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

/// Strokes the ticket outline with a slowly revolving molten-gold gradient,
/// plus a soft glow underneath so the edge reads at a glance.
class _TicketBorderPainter extends CustomPainter {
  final double t;

  const _TicketBorderPainter({required this.t});

  @override
  void paint(Canvas canvas, Size size) {
    final path = _ticketPath(size);
    final rect = Offset.zero & size;
    final shader = SweepGradient(
      colors: _kGoldColors,
      transform: GradientRotation(2 * math.pi * t),
    ).createShader(rect);

    // Glow pass
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.0
        ..shader = shader
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
    );
    // Crisp line
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.4
        ..shader = shader,
    );
  }

  @override
  bool shouldRepaint(covariant _TicketBorderPainter old) => old.t != t;
}

/// Vertical dashed "tear here" line between ticket and stub.
class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white24
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    const dash = 4.0;
    const gap = 4.0;
    double y = 0;
    while (y < size.height) {
      canvas.drawLine(Offset(0, y), Offset(0, y + dash), paint);
      y += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
