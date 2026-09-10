import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/withdraw_request_response.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class SuccessWithdrawScreen extends StatelessWidget {
  const SuccessWithdrawScreen({super.key, required this.withdrawResponse});

  final WithdrawResponse withdrawResponse;

  @override
  Widget build(BuildContext context) {
    final String qtyText = tr('order.quantity_gram_metal', {
      'qty': withdrawResponse.quantity.toStringAsFixed(0),
      'metal': withdrawResponse.metalName.toLowerCase()
    });
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      // appBar() helper буцах товчийг хаах параметргүй тул ижил загвараар
      // inline AppBar ашиглав (амжилтын дэлгэцээс буцахгүй).
      appBar: AppBar(
        backgroundColor: CustomColors.appBackground,
        surfaceTintColor: Colors.transparent,
        elevation: 0.0,
        scrolledUnderElevation: 0.0,
        automaticallyImplyLeading: false,
        title: Text(tr('order.withdraw_success_title'), style: AppText.appBarTitle),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          Center(
            child: AppIconTile(
              size: 84.0,
              color: CustomColors.positive.withOpacity(0.15),
              child: Icon(Icons.check_rounded,
                  size: 40.0, color: CustomColors.positive),
            ),
          ),
          const SizedBox(height: 20.0),
          Text(qtyText, textAlign: TextAlign.center, style: AppText.title),
          const SizedBox(height: 8.0),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              withdrawResponse.message.isNotEmpty
                  ? withdrawResponse.message
                  : tr('order.withdraw_success_message'),
              textAlign: TextAlign.center,
              style: AppText.caption.copyWith(fontSize: 13.0),
            ),
          ),
          const SizedBox(height: 24.0),
          AppCard(
            child: Column(
              children: [
                AppInfoRow(label: tr('order.quantity_label'), value: qtyText),
                const AppDivider(),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(tr('order.status_label'),
                            style: AppText.caption.copyWith(fontSize: 13.0)),
                      ),
                      AppStatusChip(
                        label: tr('common.pending'),
                        icon: Ionicons.time_outline,
                        color: CustomColors.accent,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12.0),
          AppBanner(text: tr('order.withdraw_confirm_code_note')),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: AppPrimaryButton(
            label: tr('order.finish'),
            onPressed: () {
              // Navigate back to home or main screen
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
          ),
        ),
      ),
    );
  }
}
