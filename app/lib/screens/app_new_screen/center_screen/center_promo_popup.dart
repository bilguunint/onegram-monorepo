import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Shows the campaign's promo modal (16:9 image + title + body). Tapping the
/// backdrop or the ✕ dismisses it. No-op when the popup has no content.
Future<void> showCenterPromoPopup(
  BuildContext context,
  CenterPopupInfo popup,
) {
  if (!popup.hasContent) return Future<void>.value();
  return showDialog<void>(
    context: context,
    barrierDismissible: true, // tap outside → close
    barrierColor: Colors.black.withOpacity(0.72),
    builder: (_) => _CenterPromoDialog(popup: popup),
  );
}

class _CenterPromoDialog extends StatelessWidget {
  final CenterPopupInfo popup;
  const _CenterPromoDialog({required this.popup});

  @override
  Widget build(BuildContext context) {
    final image = popup.image;
    final title = popup.title.trim();
    final body = popup.body.trim();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      clipBehavior: Clip.none,
      child: Container(
        decoration: BoxDecoration(
          color: CustomColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: CustomColors.surfaceBorder),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 16:9 image (or a muted placeholder until one is uploaded), with
            // the close button floated over its top-right corner.
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
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
                    child: _CloseButton(
                      onTap: () => Navigator.of(context).pop(),
                    ),
                  ),
                ],
              ),
            ),
            if (title.isNotEmpty || body.isNotEmpty)
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (title.isNotEmpty)
                        Text(
                          title,
                          style: AppText.sectionTitle
                              .copyWith(fontSize: 17, height: 1.25),
                        ),
                      if (title.isNotEmpty && body.isNotEmpty)
                        const SizedBox(height: 8),
                      if (body.isNotEmpty)
                        Text(
                          body,
                          style: AppText.caption
                              .copyWith(fontSize: 13, height: 1.5),
                        ),
                      const SizedBox(height: 16),
                      AppPrimaryButton(
                        label: tr('center.plant_tree'),
                        icon: Icons.park_rounded,
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      const SizedBox(height: 4),
                      Center(
                        child: TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: Text(
                            tr('common.close'),
                            style: AppText.bodyBold
                                .copyWith(color: CustomColors.textSecondary),
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
    return Container(
      color: CustomColors.surfaceAlt,
      child: const Center(
        child: Icon(Icons.forest_rounded, color: Colors.white24, size: 44),
      ),
    );
  }
}

class _CloseButton extends StatelessWidget {
  final VoidCallback onTap;
  const _CloseButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
      ),
    );
  }
}
