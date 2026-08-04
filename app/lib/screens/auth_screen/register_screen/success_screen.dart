import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';

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
      padding: const EdgeInsets.all(32.0),
      child: Column(
        children: [
          SizedBox(
              width: 200.0,
              height: 200.0,
              child: SvgPicture.asset("assets/icons/success.svg")),
          Padding(
            padding: EdgeInsets.only(bottom: 8.0, top: 16.0, right: 32.0),
            child: Text(
              widget.title,
              style: TextStyle(fontSize: 20.0, fontFamily: "RubikBold"),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 32.0),
            child: Text(
              widget.subtitle,
              style: TextStyle(
                  fontSize: 14.0,
                  color: Colors.white60),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: MainButton(
                    title: Text(
                      tr('reg.start'),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.black),
                    ),
                    onPress: () {
                      setState(() {
                        print("Success");
                      });
                    },
                    isLoading: false),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
