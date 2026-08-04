import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/order_agreement_screen.dart';
import 'package:onegrgold/l10n/app_locale.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({
    super.key,
  });

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  bool monVal = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('purchase.terms_title')),
      ),
      body: OrderAgreement()
    );
  }
}