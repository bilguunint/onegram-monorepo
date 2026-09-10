import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class MetalPriceWidget extends StatefulWidget {
  const MetalPriceWidget(
      {super.key, required this.userRepository, required this.quatity, required this.metalId, required this.isAdditional});
  final UserRepository userRepository;
  final num quatity;
  final int metalId;
  final bool isAdditional;

  @override
  State<MetalPriceWidget> createState() => _MetalPriceWidgetState();
}

class _MetalPriceWidgetState extends State<MetalPriceWidget> {
  @override
  Widget build(BuildContext context) {
    return DetailView(
      userRepository: widget.userRepository,
      quantity: widget.quatity,
      metalId: widget.metalId,
    );
  }
}

// Helper to get rate by metalId from Firestore (fields: metal_id, rate)
Future<double> _getRateByMetalId(int metalId) async {
  try {
    final q = await FirebaseFirestore.instance
        .collection('latest_rates')
        .where('id', isEqualTo: metalId)
        .get();
    if (q.docs.isEmpty) return 0.0;
    final data = q.docs.first.data();
    final num? rateNum = data['rate'] as num?;
    return (rateNum ?? 0).toDouble();
  } catch (e) {
    if (kDebugMode) {
      print('Failed to load rate for metalId=$metalId: $e');
    }
    return 0.0;
  }
}

/// Өнөөдрийн ханш, татвар/шимтгэл, нийт дүн — нэг картанд.
class DetailView extends StatelessWidget {
  const DetailView(
      {super.key, required this.userRepository, required this.quantity, required this.metalId});
  final UserRepository userRepository;
  final num quantity;
  final int metalId;

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.decimalPatternDigits(decimalDigits: 0);

    return FutureBuilder<double>(
      future: _getRateByMetalId(metalId),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return AppBanner(
            text: tr('order.detail_load_error'),
            icon: Icons.error_outline_rounded,
            color: CustomColors.negative,
          );
        }

        if (snapshot.connectionState != ConnectionState.done) {
          // loading state - show placeholders (unchanged UI)
          return _card(
            rate: "-",
            fee: "-",
            total: "-",
          );
        }

        final rate = snapshot.data ?? 0.0;
        final bool isGoldLan = metalId == 3;
        final double serviceFee = isGoldLan
            ? 1733.0 * quantity * 37.5
            : (rate * quantity) / 100 * 5;
        final double noat = isGoldLan
            ? 1120.0 * quantity * 37.5
            : (quantity * rate + serviceFee) / 100 * 20;

        return _card(
          rate: isGoldLan
              ? tr('order.rate_per_lan',
                  {'amount': currencyFormatter.format(rate * 37.5)})
              : tr('order.rate_per_gram',
                  {'amount': currencyFormatter.format(rate)}),
          fee: "${currencyFormatter.format(serviceFee + noat)}₮",
          total: isGoldLan
              ? "${currencyFormatter.format((quantity * rate * 37.5 + serviceFee + noat))}₮"
              : "${currencyFormatter.format((quantity * rate + serviceFee + noat))}₮",
        );
      },
    );
  }

  Widget _card({
    required String rate,
    required String fee,
    required String total,
  }) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ханшийн толгой мөр: icon tile + шошго, баруун талд ханш
          Row(
            children: [
              AppIconTile(
                size: 40.0,
                child: Icon(Ionicons.diamond_outline,
                    size: 18.0, color: CustomColors.accent),
              ),
              const SizedBox(width: 12.0),
              Expanded(
                child: Text(tr('order.todays_rate_label'),
                    style: AppText.bodyBold),
              ),
              const SizedBox(width: 12.0),
              Flexible(
                child: Text(
                  rate,
                  textAlign: TextAlign.right,
                  style: AppText.bodyBold.copyWith(fontSize: 15.0),
                ),
              ),
            ],
          ),
          const AppDivider(vertical: 10.0),
          AppInfoRow(
            label: tr('order.tax_and_fee_label'),
            value: fee,
          ),
          const AppDivider(),
          AppInfoRow(
            label: tr('order.total_amount_label'),
            value: total,
            valueColor: CustomColors.accent,
          ),
        ],
      ),
    );
  }
}
