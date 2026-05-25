import 'package:flutter/material.dart';

import '../style/colors.dart';

class CancelButton extends StatelessWidget {
  const CancelButton(
      {super.key, required this.title, required this.onPress, required this.isLoading});

  final Widget title;
  final void Function()? onPress;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 45.0,
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8.0),
          color: CustomColors.alerRed),
      child: ElevatedButton(
        style: ButtonStyle(
          backgroundColor: MaterialStateProperty.all(Colors.transparent),
          // elevation: MaterialStateProperty.all(3),
          shadowColor: MaterialStateProperty.all(Colors.transparent),

          shape: MaterialStateProperty.all<RoundedRectangleBorder>(
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0))),
        ),
        onPressed: onPress,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: isLoading
              ? const SizedBox(
                  height: 20.0,
                  width: 20.0,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.0,
                    color: Colors.black,
                  ),
                )
              : title,
        ),
      ),
    );
  }
}
