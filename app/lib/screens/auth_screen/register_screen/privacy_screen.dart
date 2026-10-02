import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/order_agreement_screen.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';

/// Үйлчилгээний нөхцөл / Нууцлалын бодлогын бүтэн дэлгэц.
/// [termsKey] — Firestore `terms/{key}`: `general` эсвэл `privacy`.
class PrivacyScreen extends StatelessWidget {
  final String termsKey;
  final String titleKey;

  const PrivacyScreen({
    super.key,
    this.termsKey = 'general',
    this.titleKey = 'more.terms',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr(titleKey)),
      body: Column(
        children: [OrderAgreement(termsKey: termsKey)],
      ),
    );
  }
}
