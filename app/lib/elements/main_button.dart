import 'package:flutter/material.dart';

import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Хуучин API (title Widget, onPress, isLoading) хадгалсан үндсэн товч —
/// харагдах байдал нь AppPrimaryButton-тэй ижил (52px, алтан, 14 радиус).
class MainButton extends StatelessWidget {
  const MainButton(
      {super.key,
      required this.title,
      required this.onPress,
      required this.isLoading});

  final Widget title;
  final void Function()? onPress;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final bool enabled = onPress != null && !isLoading;
    return SizedBox(
      height: 52.0,
      width: double.infinity,
      child: Opacity(
        opacity: enabled || isLoading ? 1.0 : 0.45,
        child: Material(
          color: CustomColors.accent,
          borderRadius: BorderRadius.circular(14.0),
          child: InkWell(
            onTap: enabled ? onPress : null,
            borderRadius: BorderRadius.circular(14.0),
            child: Center(
              child: isLoading
                  ? const SizedBox(
                      height: 20.0,
                      width: 20.0,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.0, color: Colors.black),
                    )
                  : DefaultTextStyle.merge(
                      style: AppText.button.copyWith(color: Colors.black),
                      child: IconTheme.merge(
                        data: const IconThemeData(
                            color: Colors.black, size: 18.0),
                        child: title,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
