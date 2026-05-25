import 'package:flutter/cupertino.dart';

showPopUpDialog(
    BuildContext context, String title, String content, List<Widget> actions) {
  // set up the AlertDialog
  return showCupertinoDialog(
    barrierDismissible: true,
    context: context,
    builder: (context) {
      return CupertinoAlertDialog(
        title: Text(title, style: const TextStyle(fontSize: 15.0)),
        content: Padding(
          padding: const EdgeInsets.only(top: 3.0),
          child: Text(content),
        ),
        actions: actions,
      );
    },
  );
}
