import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_order_screen.dart'
    show kForestGreen, kLeafGreen;

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
          color: const Color(0xFF1A1A1C),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: kForestGreen.withOpacity(0.35)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 16:9 image (or a green placeholder until one is uploaded), with
            // the close button floated over its top-right corner.
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
                  child: _CloseButton(
                    onTap: () => Navigator.of(context).pop(),
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
                          onTap: () => Navigator.of(context).pop(),
                          child: Container(
                            height: 44,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [kForestGreen, kLeafGreen],
                              ),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              tr('center.plant_tree'),
                              style: const TextStyle(
                                color: Colors.white,
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
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            kForestGreen.withOpacity(0.55),
            const Color(0xFF15251A),
          ],
        ),
      ),
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
