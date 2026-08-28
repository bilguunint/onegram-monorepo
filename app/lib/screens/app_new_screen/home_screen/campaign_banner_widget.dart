import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:rainbow_edge_lighting/rainbow_edge_lighting.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_promo_popup.dart';
import 'package:onegrgold/style/colors.dart';

/// Molten-gold palette for the animated card edge (loops seamlessly) — the
/// same treatment the Морин хуур card gets, in lottery colours.
const List<Color> _kGoldColors = [
  Color(0xFFB8860B), // dark goldenrod
  Color(0xFFFFD700), // gold
  Color(0xFFFFF3B0), // bright highlight
  Color(0xFFFCD535), // brand gold
  Color(0xFFFF9100), // amber flash
  Color(0xFFB8860B), // dark goldenrod (loop)
];

/// The "Сугалаат аян" section on the home screen: a full-width card styled as
/// a lottery ticket — animated golden edge, a perforated stub with the golden
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

class _CampaignBannerWidgetState extends State<CampaignBannerWidget> {
  LotteryCampaignInfo? _campaign;
  int _myTickets = 0;

  @override
  void initState() {
    super.initState();
    _load();
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
            child: RainbowEdgeLighting(
              radius: 16,
              thickness: 0.6,
              speed: 0.4,
              colors: _kGoldColors,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 21 / 9,
                  child: LayoutBuilder(builder: (context, box) {
                    // The stub is the right ~30% of the ticket, separated by a
                    // perforation: two notches punched through the edge and a
                    // dashed tear line between them.
                    final stubWidth = box.maxWidth * 0.30;
                    final tearX = box.maxWidth - stubWidth;
                    return Stack(
                      fit: StackFit.expand,
                      children: [
                        Row(
                          children: [
                            Expanded(child: _coverSide(campaign)),
                            SizedBox(width: stubWidth, child: _stub()),
                          ],
                        ),
                        // Tear line
                        Positioned(
                          left: tearX - 0.75,
                          top: 8,
                          bottom: 8,
                          child: CustomPaint(
                            size: const Size(1.5, double.infinity),
                            painter: _DashedLinePainter(),
                          ),
                        ),
                        // Punched notches: circles in the scaffold colour so
                        // they read as cut-outs through card and border alike.
                        Positioned(
                          left: tearX - 7,
                          top: -7,
                          child: _notch(),
                        ),
                        Positioned(
                          left: tearX - 7,
                          bottom: -7,
                          child: _notch(),
                        ),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _notch() {
    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        color: CustomColors.scaffoldDarkBack,
        shape: BoxShape.circle,
      ),
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
    final hasTickets = _myTickets > 0;
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
          if (hasTickets) ...[
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
          ] else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                tr('lottery.join_now'),
                textAlign: TextAlign.center,
                maxLines: 2,
                style: TextStyle(
                  color: CustomColors.mainColor,
                  fontSize: 11,
                  fontFamily: "RubikBold",
                  height: 1.2,
                ),
              ),
            ),
        ],
      ),
    );
  }
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
