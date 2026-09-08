import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:intl/intl.dart';
import 'package:onegrgold/models/rate_model.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class GoldRateWidget extends StatelessWidget {
  const GoldRateWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat();
    return FutureBuilder<RateModel?>(
      future: fetchGoldRate(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CupertinoActivityIndicator();
        }

        if (!snapshot.hasData || snapshot.data == null) {
          return Text(tr('home.dollar_rate_not_found'));
        }

        final metal = snapshot.data!;
        final bool isDown = metal.changePercent.isNegative;

        return Container(
          padding: const EdgeInsets.all(14.0),
          decoration: BoxDecoration(
            color: CustomColors.surface,
            borderRadius: BorderRadius.circular(16.0),
            border: Border.all(width: 1.0, color: CustomColors.surfaceBorder),
          ),
          child: Row(
            children: [
              AppIconTile(
                  child: SvgPicture.asset(
                "assets/icons/gold-bar-active.svg",
                height: 18.0,
                color: CustomColors.accent,
              )),
              const SizedBox(width: 12.0),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tr('order.gold'), style: AppText.bodyBold),
                  const SizedBox(height: 2.0),
                  Text("XAU", style: AppText.caption),
                ],
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "${currencyFormatter.format(metal.rate)}₮",
                    style: AppText.bodyBold,
                  ),
                  const SizedBox(height: 2.0),
                  Text(
                    "${isDown ? '' : '+'}${metal.changePercent.toStringAsFixed(2)}%",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontFamily: "Inter",
                      fontSize: 12.0,
                      color: isDown
                          ? CustomColors.negative
                          : CustomColors.positive,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<RateModel?> fetchGoldRate() async {
    final snapshot = await FirebaseFirestore.instance
        .collection('latest_rates')
        .where('id', isEqualTo: 1)
        .limit(1)
        .get();

    if (snapshot.docs.isNotEmpty) {
      final data = snapshot.docs.first.data();
      return RateModel.fromMap(data);
    }
    return null;
  }
}
