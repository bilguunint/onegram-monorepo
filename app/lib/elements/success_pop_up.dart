import 'package:flutter/material.dart';

import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/style/colors.dart';

/// Амжилтын popup — ногоон check icon (зөвхөн амжилтын төлөвт ногоон ашиглана)
showSuccessPopUpDialog(BuildContext context, String msg, double height) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AppMessageDialog(
        message: msg,
        icon: Icons.check_rounded,
        color: CustomColors.positive,
      );
    },
  );
}
