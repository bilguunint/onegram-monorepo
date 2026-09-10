import 'package:flutter/material.dart';

import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Хуучин API хадгалсан цуцлах товч — улаан (negative) дэвсгэр, цагаан текст
class CancelButton extends StatelessWidget {
  const CancelButton(
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
          color: CustomColors.negative,
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
                          strokeWidth: 2.0, color: Colors.white),
                    )
                  : DefaultTextStyle.merge(
                      style: AppText.button.copyWith(color: Colors.white),
                      child: IconTheme.merge(
                        data: const IconThemeData(
                            color: Colors.white, size: 18.0),
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
