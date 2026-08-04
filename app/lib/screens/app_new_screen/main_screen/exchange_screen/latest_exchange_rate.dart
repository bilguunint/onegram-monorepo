import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/colors.dart';

class LatestExchangeRate extends StatefulWidget {
  const LatestExchangeRate({super.key, required this.userRepository, required this.metalId});
  final UserRepository userRepository;
  final int metalId;

  @override
  State<LatestExchangeRate> createState() => _LatestExchangeRateState();
}

class _LatestExchangeRateState extends State<LatestExchangeRate> {
  final currencyFormatter = NumberFormat();

  @override
  Widget build(BuildContext context) {
    return DetailView(
      userRepository: widget.userRepository,
      metalId: widget.metalId,
    );
  }
}

class DetailView extends StatelessWidget {
  const DetailView({super.key, required this.userRepository, required this.metalId});
  final UserRepository userRepository;
  final int metalId;

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat();

    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('latest_rates')
          .where('id', isEqualTo: metalId)
          .limit(1)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _skeleton();
        }
        if (snapshot.hasError) {
          print(snapshot.error);
          return Center(
            child: Text(
              metalId == 1
                  ? tr('order.gold_rate_error')
                  : tr('order.silver_rate_error'),
              style: const TextStyle(color: Colors.black),
            ),
          );
        }

        final doc = snapshot.data?.docs.isNotEmpty == true ? snapshot.data!.docs.first : null;
        if (doc == null) {
          return _skeleton();
        }
        final data = doc.data();
        final double rate = (data['rate'] as num?)?.toDouble() ?? 0.0;
        final double changePercent = (data['changes'] as num?)?.toDouble() ??
            (data['change_percent'] as num?)?.toDouble() ??
            (data['change'] as num?)?.toDouble() ??
            0.0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            metalId == 1 ? tr('order.gold') : tr('order.silver'),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16.0,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            metalId == 1 ? 'XAU' : 'XAG',
                            style: const TextStyle(
                              fontSize: 14.0,
                              color: Colors.white38,
                            ),
                          )
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(0.0),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(4.0),
                          color: changePercent.isNegative ? CustomColors.alerRed : CustomColors.successGreen,
                        ),
                        child: Icon(
                          changePercent.isNegative ? Ionicons.caret_down : Ionicons.caret_up,
                          color: Colors.white,
                          size: 18.0,
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 8.0),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${currencyFormatter.format(rate)}₮',
                        style: const TextStyle(
                          fontSize: 20.0,
                          fontFamily: 'InterBold',
                        ),
                      ),
                      Text(
                        '${changePercent.toStringAsFixed(2)}%',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: changePercent.isNegative ? CustomColors.alerRed : CustomColors.successGreen,
                          fontSize: 12.0,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _skeleton() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              SizedBox(height: 8.0),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '-₮',
                    style: TextStyle(
                      fontSize: 20.0,
                      fontFamily: 'InterBold',
                    ),
                  ),
                  Text(
                    '-%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white38,
                      fontFamily: 'Commissioner',
                      fontSize: 12.0,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}