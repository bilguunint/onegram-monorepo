import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/models/rate_model.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';

class DollarRateWidget extends StatelessWidget {
  const DollarRateWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat();
    return FutureBuilder<RateModel?>(
  future: fetchDollarRate(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const CupertinoActivityIndicator(); // эсвэл shimmer
    }

    if (!snapshot.hasData || snapshot.data == null) {
      return Text(tr('home.gold_rate_not_found'));
    }

    final metal = snapshot.data!;

    return Container(
      decoration: BoxDecoration(
        color: CustomColors.darkContainerColor,
        borderRadius: BorderRadius.circular(8.0),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Алт гарчиг хэсэг
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tr('home.dollar'),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14.0,
                            color: Colors.white,
                          ),
                        ),
                        const Text(
                          "USD",
                          style: TextStyle(
                            fontSize: 10.0,
                            color: Colors.white38,
                          ),
                        )
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.all(0.0),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4.0),
                        color: metal.changePercent.isNegative
                            ? CustomColors.alerRed
                            : CustomColors.successGreen,
                      ),
                      child: metal.changePercent.isNegative
                          ? const Icon(
                              Ionicons.caret_down,
                              color: Colors.white,
                              size: 18.0,
                            )
                          : const Icon(
                              Ionicons.caret_up,
                              color: Colors.white,
                              size: 18.0,
                            ),
                    )
                  ],
                ),
                const SizedBox(height: 8.0),
                // Үнэ ба хувь өөрчлөлт
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "${currencyFormatter.format(metal.rate)}₮",
                      style: const TextStyle(
                        fontSize: 14.0,
                        fontFamily: "InterBold",
                      ),
                    ),
                    Text(
                      "${metal.changePercent.toStringAsFixed(2)}%",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontFamily: "Commissioner",
                        fontSize: 12.0,
                        color: metal.changePercent.isNegative
                            ? CustomColors.alerRed
                            : CustomColors.successGreen,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  },
);
  }
  Future<RateModel?> fetchDollarRate() async {
  final snapshot = await FirebaseFirestore.instance
      .collection('rates')
      .where('id', isEqualTo: 2)
      .limit(1)
      .get();

  if (snapshot.docs.isNotEmpty) {
    final data = snapshot.docs.first.data();
    return RateModel.fromMap(data);
  }
  return null;
}
}