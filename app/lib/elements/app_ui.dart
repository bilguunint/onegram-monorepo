import 'package:flutter/material.dart';

import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Radianpay маягийн нийтлэг UI элементүүд: карт, товч, хэсгийн гарчиг, icon tile.

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
    this.radius = 20.0,
    this.color,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? CustomColors.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(width: 1.0, color: CustomColors.surfaceBorder),
      ),
      child: child,
    );
  }
}

class AppPrimaryButton extends StatelessWidget {
  const AppPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.outlined = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    final Color fg = outlined ? Colors.white : Colors.black;
    return SizedBox(
      height: 52.0,
      width: double.infinity,
      child: Material(
        color: outlined ? CustomColors.surfaceAlt : CustomColors.accent,
        borderRadius: BorderRadius.circular(14.0),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(14.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18.0, color: fg),
                const SizedBox(width: 8.0),
              ],
              Text(label, style: AppText.button.copyWith(color: fg)),
            ],
          ),
        ),
      ),
    );
  }
}

class AppSectionHeader extends StatelessWidget {
  const AppSectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
          left: 16.0, right: 16.0, top: 24.0, bottom: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppText.sectionTitle),
          if (actionLabel != null)
            GestureDetector(
              onTap: onAction,
              child: Text(actionLabel!, style: AppText.link),
            ),
        ],
      ),
    );
  }
}

/// Жагсаалтын мөрийн зүүн талын дөрвөлжин icon (Radianpay-ийн transaction row маяг)
class AppIconTile extends StatelessWidget {
  const AppIconTile({
    super.key,
    required this.child,
    this.size = 46.0,
    this.color,
  });

  final Widget child;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color ?? CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: Center(child: child),
    );
  }
}
