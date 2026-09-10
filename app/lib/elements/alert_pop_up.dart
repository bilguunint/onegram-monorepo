import 'package:flutter/material.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Анхааруулгын popup — surface карт, алтан icon, төвд мессеж.
/// [height] нь хуучин API-тай нийцүүлэхийн тулд үлдсэн; агуулга өөрөө өндрөө тодорхойлно.
showAlertPopUpDialog(BuildContext context, String msg, double height) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AppMessageDialog(
        message: msg,
        icon: Icons.error_outline_rounded,
        color: CustomColors.accent,
      );
    },
  );
}

/// Alert / success popup-ийн нийтлэг бүрхүүл
class AppMessageDialog extends StatelessWidget {
  const AppMessageDialog({
    super.key,
    required this.message,
    required this.icon,
    required this.color,
    this.title,
  });

  final String message;
  final IconData icon;
  final Color color;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: CustomColors.surface,
      surfaceTintColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 32.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.0),
        side: BorderSide(color: CustomColors.surfaceBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24.0, 24.0, 24.0, 20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppIconTile(
              size: 56.0,
              color: color.withOpacity(0.15),
              child: Icon(icon, size: 28.0, color: color),
            ),
            const SizedBox(height: 14.0),
            if (title != null) ...[
              Text(title!,
                  textAlign: TextAlign.center, style: AppText.sectionTitle),
              const SizedBox(height: 6.0),
            ],
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppText.body.copyWith(height: 1.45),
            ),
          ],
        ),
      ),
    );
  }
}
