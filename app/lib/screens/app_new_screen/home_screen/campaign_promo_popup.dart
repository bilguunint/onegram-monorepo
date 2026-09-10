import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// The campaign's promo modal (16:9 image + title + body), fired once per app
/// launch from the home banner. Tapping the backdrop, the ✕ or the muted
/// "close" link dismisses it; the primary button opens the campaign and
/// closes the popup.
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
      backgroundColor: CustomColors.surface,
      surfaceTintColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: CustomColors.surfaceBorder),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
                child: AspectRatio(
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
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (title.isNotEmpty)
                    Text(title,
                        style: AppText.sectionTitle.copyWith(height: 1.25)),
                  if (title.isNotEmpty && body.isNotEmpty)
                    const SizedBox(height: 8),
                  if (body.isNotEmpty)
                    Text(body, style: AppText.caption.copyWith(fontSize: 13)),
                  const SizedBox(height: 16),
                  AppPrimaryButton(
                    label: tr('lottery.section_title'),
                    onPressed: () {
                      Navigator.of(context).pop();
                      onOpen();
                    },
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text(
                        tr('common.close'),
                        style: AppText.caption.copyWith(fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return ColoredBox(
      color: CustomColors.surfaceAlt,
      child: const Center(
        child: Icon(Icons.confirmation_number_outlined,
            color: Colors.white24, size: 44),
      ),
    );
  }
}
