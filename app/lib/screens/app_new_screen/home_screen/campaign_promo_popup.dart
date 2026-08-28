import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/style/colors.dart';

/// The campaign's promo modal (16:9 image + title + body), fired once per app
/// launch from the home banner. Tapping the backdrop or the ✕ dismisses it;
/// the button opens the campaign and closes the popup.
Future<void> showCampaignPromoPopup(
  BuildContext context,
  LotteryCampaignInfo campaign, {
  required VoidCallback onOpen,
}) {
  if (!campaign.popup.hasContent) return Future<void>.value();
  return showDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierColor: Colors.black.withOpacity(0.72),
    builder: (_) => _CampaignPromoDialog(campaign: campaign, onOpen: onOpen),
  );
}

class _CampaignPromoDialog extends StatelessWidget {
  final LotteryCampaignInfo campaign;
  final VoidCallback onOpen;
  const _CampaignPromoDialog({required this.campaign, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final popup = campaign.popup;
    final image = popup.image;
    final title = popup.title.trim();
    final body = popup.body.trim();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      clipBehavior: Clip.none,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1C),
          borderRadius: BorderRadius.circular(18),
          border:
              Border.all(color: CustomColors.mainColor.withOpacity(0.35)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: (image != null && image.isNotEmpty)
                      ? Image.network(
                          image,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, progress) =>
                              progress == null ? child : _placeholder(),
                          errorBuilder: (_, __, ___) => _placeholder(),
                        )
                      : _placeholder(),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 30,
                      height: 30,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close_rounded,
                          color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ],
            ),
            if (title.isNotEmpty || body.isNotEmpty)
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (title.isNotEmpty)
                        Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'InterBold',
                            fontWeight: FontWeight.w800,
                            fontSize: 17,
                            height: 1.25,
                          ),
                        ),
                      if (title.isNotEmpty && body.isNotEmpty)
                        const SizedBox(height: 8),
                      if (body.isNotEmpty)
                        Text(
                          body,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                            height: 1.5,
                          ),
                        ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: GestureDetector(
                          onTap: () {
                            Navigator.of(context).pop();
                            onOpen();
                          },
                          child: Container(
                            height: 44,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: CustomColors.mainColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              tr('lottery.section_title'),
                              style: const TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2A2410), Color(0xFF161618)],
        ),
      ),
      child: Center(
        child: Icon(Icons.confirmation_number_outlined,
            color: Colors.white24, size: 44),
      ),
    );
  }
}
