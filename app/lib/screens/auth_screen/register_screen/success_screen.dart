import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class SuccessScreen extends StatefulWidget {
  const SuccessScreen(
      {super.key,
      required this.title,
      required this.subtitle});
  final String title;
  final String subtitle;

  @override
  State<SuccessScreen> createState() => _SuccessScreenState();
}

class _SuccessScreenState extends State<SuccessScreen> {

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16.0, 32.0, 16.0, 12.0),
      child: Column(
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AppIconTile(
                  size: 84.0,
                  child: Icon(
                    Icons.check_rounded,
                    size: 40.0,
                    color: CustomColors.positive,
                  ),
                ),
                const SizedBox(height: 24.0),
                Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  style: AppText.title,
                ),
                const SizedBox(height: 8.0),
                Text(
                  widget.subtitle,
                  textAlign: TextAlign.center,
                  style: AppText.caption.copyWith(fontSize: 14.0),
                ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: AppPrimaryButton(
              label: tr('reg.start'),
              onPressed: () {
                setState(() {
                  print("Success");
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}
