import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/style/colors.dart';

showSuccessPopUpDialog(BuildContext context, String msg, double height) {
  // set up the AlertDialog
  AlertDialog alert = AlertDialog(
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8.0))),
    content: SizedBox(
      height: height,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Icon(
            Ionicons.checkmark_circle_outline,
            color: CustomColors.mainColor,
            size: 35.0,
          ),
          const SizedBox(
            height: 10.0,
          ),
          Text(
            msg,
            style: const TextStyle(fontSize: 14.0),
          )
        ],
      ),
    ),
  );

  showDialog(
    context: context,
    builder: (BuildContext context) {
      return alert;
    },
  );
}
