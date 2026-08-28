import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_detail_screen.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_promo_popup.dart';
import 'package:onegrgold/style/colors.dart';

/// The "Сугалаат аян" section on the home screen: a section header and one
/// full-width 21:9 banner card for the running campaign. Occupies no space at
/// all when no current-schema campaign is active.
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
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: AspectRatio(
                aspectRatio: 21 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _cover(campaign),
                    // Legibility scrim behind the overlaid texts.
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: [0.35, 1.0],
                          colors: [Colors.transparent, Colors.black87],
                        ),
                      ),
                    ),
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 10,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  campaign.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontFamily: "InterBold",
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  campaign.daysLeft > 0
                                      ? tr('lottery.days_left',
                                          {'days': campaign.daysLeft})
                                      : tr('lottery.ends_today'),
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_myTickets > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.45),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color:
                                        CustomColors.mainColor.withOpacity(0.6)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.confirmation_number_outlined,
                                      size: 12, color: CustomColors.mainColor),
                                  const SizedBox(width: 4),
                                  Text(
                                    tr('lottery.my_tickets_count',
                                        {'count': _myTickets}),
                                    style: TextStyle(
                                      color: CustomColors.mainColor,
                                      fontSize: 10,
                                      fontFamily: "RubikBold",
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
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
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2A2410), Color(0xFF161618)],
        ),
      ),
      child: Center(
        child: Icon(Icons.confirmation_number_outlined,
            color: CustomColors.mainColor.withOpacity(0.35), size: 40),
      ),
    );
  }
}
