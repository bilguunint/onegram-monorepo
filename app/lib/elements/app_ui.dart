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

/// Дэлгэцийн AppBar — appBackground дэвсгэр, AppText.appBarTitle гарчиг, зүүн зэрэгцүүлэлт
PreferredSizeWidget appBar(String title, {List<Widget>? actions}) {
  return AppBar(
    backgroundColor: CustomColors.appBackground,
    surfaceTintColor: Colors.transparent,
    elevation: 0.0,
    scrolledUnderElevation: 0.0,
    iconTheme: const IconThemeData(color: Colors.white),
    title: Text(title, style: AppText.appBarTitle),
    centerTitle: false,
    actions: actions,
  );
}

class AppPrimaryButton extends StatelessWidget {
  const AppPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.outlined = false,
    this.danger = false,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool outlined;

  /// Улаан (цуцлах, устгах) товч
  final bool danger;

  /// Ачаалж байх үед spinner харуулж, дарахыг түр хаана
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final bool enabled = onPressed != null && !loading;
    final Color fg = outlined
        ? Colors.white
        : danger
            ? Colors.white
            : Colors.black;
    final Color bg = outlined
        ? CustomColors.surfaceAlt
        : danger
            ? CustomColors.negative
            : CustomColors.accent;
    return SizedBox(
      height: 52.0,
      width: double.infinity,
      child: Opacity(
        opacity: enabled || loading ? 1.0 : 0.45,
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(14.0),
          child: InkWell(
            onTap: enabled ? onPressed : null,
            borderRadius: BorderRadius.circular(14.0),
            child: loading
                ? Center(
                    child: SizedBox(
                      width: 20.0,
                      height: 20.0,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.0, color: fg),
                    ),
                  )
                : Row(
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
      ),
    );
  }
}

/// Жижиг төлөвийн chip — зөөлөн дэвсгэр дээр өнгөт текст (Active, Paid г.м.)
class AppStatusChip extends StatelessWidget {
  const AppStatusChip({
    super.key,
    required this.label,
    this.color,
    this.icon,
  });

  final String label;
  final Color? color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final Color c = color ?? CustomColors.accent;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
      decoration: BoxDecoration(
        color: c.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12.0, color: c),
            const SizedBox(width: 4.0),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: AppText.bold,
              fontSize: 10.5,
              fontWeight: FontWeight.bold,
              color: c,
            ),
          ),
        ],
      ),
    );
  }
}

/// Шошго зүүн талд бүдэг, утга баруун талд тод — картын доторх мэдээллийн мөр
class AppInfoRow extends StatelessWidget {
  const AppInfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.icon,
    this.dense = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final IconData? icon;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: dense ? 4.0 : 7.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 15.0, color: CustomColors.textSecondary),
            const SizedBox(width: 8.0),
          ],
          Expanded(
            child: Text(label, style: AppText.caption.copyWith(fontSize: 13.0)),
          ),
          const SizedBox(width: 12.0),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: AppText.bodyBold
                  .copyWith(color: valueColor ?? Colors.white, fontSize: 13.5),
            ),
          ),
        ],
      ),
    );
  }
}

/// Картын доторх нимгэн зураас
class AppDivider extends StatelessWidget {
  const AppDivider({super.key, this.vertical = 4.0});
  final double vertical;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: vertical),
      child: Container(height: 1.0, color: CustomColors.surfaceBorder),
    );
  }
}

/// Анхааруулга / мэдээллийн зөөлөн banner
class AppBanner extends StatelessWidget {
  const AppBanner({
    super.key,
    required this.text,
    this.icon = Icons.info_outline_rounded,
    this.color,
    this.title,
    this.trailing,
    this.onTap,
  });

  final String text;
  final String? title;
  final IconData icon;
  final Color? color;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Color c = color ?? CustomColors.accent;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: c.withOpacity(0.10),
          borderRadius: BorderRadius.circular(14.0),
          border: Border.all(color: c.withOpacity(0.30)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(icon, size: 18.0, color: c),
            const SizedBox(width: 10.0),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (title != null) ...[
                    Text(title!,
                        style: AppText.bodyBold.copyWith(fontSize: 13.0)),
                    const SizedBox(height: 2.0),
                  ],
                  Text(text,
                      style: AppText.caption.copyWith(
                          color: Colors.white.withOpacity(0.78))),
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 8.0),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Хоосон эсвэл алдааны төлөв — төвд icon, гарчиг, тайлбар
class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppIconTile(
              size: 72.0,
              child: Icon(icon,
                  size: 34.0, color: iconColor ?? CustomColors.textSecondary),
            ),
            const SizedBox(height: 16.0),
            Text(title,
                textAlign: TextAlign.center, style: AppText.sectionTitle),
            if (subtitle != null) ...[
              const SizedBox(height: 6.0),
              Text(subtitle!,
                  textAlign: TextAlign.center, style: AppText.caption),
            ],
          ],
        ),
      ),
    );
  }
}

/// Текст оролтын нэгдсэн decoration — surfaceAlt дэвсгэр, 14 радиус, accent focus
InputDecoration appInputDecoration({
  String? hint,
  String? label,
  Widget? prefix,
  Widget? suffix,
  String? suffixText,
  String? errorText,
}) {
  OutlineInputBorder border(Color c) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(14.0),
        borderSide: BorderSide(color: c, width: 1.0),
      );
  return InputDecoration(
    hintText: hint,
    labelText: label,
    errorText: errorText,
    hintStyle: AppText.body.copyWith(color: CustomColors.textTertiary),
    labelStyle: AppText.caption,
    suffixText: suffixText,
    suffixStyle: AppText.bodyBold.copyWith(color: CustomColors.textSecondary),
    prefixIcon: prefix,
    suffixIcon: suffix,
    prefixIconColor: CustomColors.textSecondary,
    suffixIconColor: CustomColors.textSecondary,
    filled: true,
    fillColor: CustomColors.surfaceAlt,
    contentPadding:
        const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
    enabledBorder: border(Colors.transparent),
    disabledBorder: border(Colors.transparent),
    focusedBorder: border(CustomColors.accent),
    errorBorder: border(CustomColors.negative),
    focusedErrorBorder: border(CustomColors.negative),
    errorStyle: AppText.caption.copyWith(color: CustomColors.negative),
  );
}

/// Bottom sheet-ийн нийтлэг бүрхүүл — дээд булан бөөрөнхий, чирэх бариул
class AppSheet extends StatelessWidget {
  const AppSheet({
    super.key,
    required this.child,
    this.title,
    this.padding = const EdgeInsets.fromLTRB(20.0, 8.0, 20.0, 24.0),
  });

  final Widget child;
  final String? title;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: CustomColors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24.0)),
        border: Border.all(color: CustomColors.surfaceBorder),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: padding,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40.0,
                  height: 4.0,
                  margin: const EdgeInsets.only(bottom: 16.0),
                  decoration: BoxDecoration(
                    color: CustomColors.textTertiary,
                    borderRadius: BorderRadius.circular(2.0),
                  ),
                ),
              ),
              if (title != null) ...[
                Text(title!, style: AppText.sectionTitle.copyWith(fontSize: 18.0)),
                const SizedBox(height: 14.0),
              ],
              child,
            ],
          ),
        ),
      ),
    );
  }
}

/// Нэг мөрөнд зүүн icon tile, гарчиг/тайлбар, баруун талд утга эсвэл chevron
class AppListRow extends StatelessWidget {
  const AppListRow({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.padding = const EdgeInsets.symmetric(vertical: 10.0),
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12.0),
      child: Padding(
        padding: padding,
        child: Row(
          children: [
            if (leading != null) ...[
              leading!,
              const SizedBox(width: 12.0),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodyBold),
                  if (subtitle != null) ...[
                    const SizedBox(height: 3.0),
                    Text(subtitle!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 10.0),
              trailing!,
            ] else if (onTap != null)
              Icon(Icons.chevron_right_rounded,
                  size: 20.0, color: CustomColors.textSecondary),
          ],
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

/// Баталгаажуулах / мэдээллийн нэгдсэн dialog. Товчнууд нэг мөрөнд зэрэгцэнэ:
/// [secondaryLabel] байвал зүүн талд surfaceAlt, [primaryLabel] баруун талд
/// алтан (эсвэл [danger] бол улаан).
class AppDialog extends StatelessWidget {
  const AppDialog({
    super.key,
    required this.title,
    this.message,
    this.content,
    this.icon,
    this.iconColor,
    required this.primaryLabel,
    required this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
    this.danger = false,
  });

  final String title;
  final String? message;

  /// [message]-ийн оронд дурын widget харуулах бол
  final Widget? content;
  final IconData? icon;
  final Color? iconColor;
  final String primaryLabel;
  final VoidCallback onPrimary;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final Color ic = iconColor ?? (danger ? CustomColors.negative : CustomColors.accent);
    return Dialog(
      backgroundColor: CustomColors.surface,
      surfaceTintColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20.0),
        side: BorderSide(color: CustomColors.surfaceBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20.0, 22.0, 20.0, 20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (icon != null) ...[
              AppIconTile(
                size: 48.0,
                color: ic.withOpacity(0.15),
                child: Icon(icon, size: 24.0, color: ic),
              ),
              const SizedBox(height: 14.0),
            ],
            Text(title, style: AppText.sectionTitle.copyWith(fontSize: 17.0)),
            const SizedBox(height: 8.0),
            if (content != null)
              content!
            else if (message != null)
              Text(message!,
                  style: AppText.body.copyWith(
                      color: CustomColors.textSecondary, height: 1.45)),
            const SizedBox(height: 20.0),
            Row(
              children: [
                if (secondaryLabel != null) ...[
                  Expanded(
                    child: _DialogButton(
                      label: secondaryLabel!,
                      onTap: onSecondary ?? () => Navigator.of(context).pop(),
                      bg: CustomColors.surfaceAlt,
                      fg: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 10.0),
                ],
                Expanded(
                  child: _DialogButton(
                    label: primaryLabel,
                    onTap: onPrimary,
                    bg: danger ? CustomColors.negative : CustomColors.accent,
                    fg: danger ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DialogButton extends StatelessWidget {
  const _DialogButton(
      {required this.label,
      required this.onTap,
      required this.bg,
      required this.fg});
  final String label;
  final VoidCallback onTap;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46.0,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(12.0),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12.0),
          child: Center(
            child: Text(label,
                style: AppText.button.copyWith(color: fg, fontSize: 14.0)),
          ),
        ),
      ),
    );
  }
}
