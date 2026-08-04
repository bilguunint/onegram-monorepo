import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';

/// Compact globe + language badge. Tapping opens the picker sheet.
/// Used in the login screen's top-right corner.
class LanguageSwitcherButton extends StatelessWidget {
  final Color? color;
  const LanguageSwitcherButton({super.key, this.color});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLanguage>(
      valueListenable: AppLocale.notifier,
      builder: (context, lang, _) {
        final fg = color ?? Colors.white;
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => showLanguagePicker(context),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: fg.withOpacity(0.08),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: fg.withOpacity(0.18)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.language_rounded, size: 15, color: fg),
                const SizedBox(width: 5),
                Text(
                  lang.shortLabel,
                  style: TextStyle(
                    color: fg,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Bottom sheet listing the four supported languages.
Future<void> showLanguagePicker(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => _LanguageSheet(),
  );
}

class _LanguageSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1C),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  tr('language.choose'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontFamily: 'InterBold',
                    fontSize: 15,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            ValueListenableBuilder<AppLanguage>(
              valueListenable: AppLocale.notifier,
              builder: (context, current, _) {
                return Column(
                  children: AppLanguage.values.map((lang) {
                    final selected = lang == current;
                    return ListTile(
                      onTap: () {
                        AppLocale.set(lang);
                        Navigator.of(context).pop();
                      },
                      leading: Container(
                        width: 34,
                        height: 34,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: selected
                              ? CustomColors.mainColor.withOpacity(0.15)
                              : Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: Text(
                          lang.shortLabel,
                          style: TextStyle(
                            color: selected
                                ? CustomColors.mainColor
                                : Colors.white60,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(
                        lang.label,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight:
                              selected ? FontWeight.w700 : FontWeight.w400,
                        ),
                      ),
                      trailing: selected
                          ? Icon(Icons.check_rounded,
                              color: CustomColors.mainColor, size: 20)
                          : null,
                    );
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
