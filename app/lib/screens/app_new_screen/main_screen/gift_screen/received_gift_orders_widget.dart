import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/models/gift_order_model.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'gift_detail_screen.dart';

class ReceivedGiftOrdersWidget extends StatefulWidget {
  const ReceivedGiftOrdersWidget({super.key});

  @override
  State<ReceivedGiftOrdersWidget> createState() => _ReceivedGiftOrdersWidgetState();
}

class _ReceivedGiftOrdersWidgetState extends State<ReceivedGiftOrdersWidget> {
  final currencyFormatter = NumberFormat();

  Stream<List<GiftOrder>> _getReceivedGiftOrders() {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      return Stream.value([]);
    }

    return FirebaseFirestore.instance
        .collection('gift_orders')
        .where('receiver.uid', isEqualTo: currentUser.uid)
        .orderBy('created_at', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return GiftOrder.fromMap(doc.id, doc.data());
      }).toList();
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return CustomColors.textGrey;
      case 'received':
        return CustomColors.successGreen;
      case 'cancelled':
      case 'failed':
        return CustomColors.alerRed;
      default:
        return CustomColors.mainColor;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Ionicons.time_outline;
      case 'received':
        return Ionicons.checkmark_circle_outline;
      case 'cancelled':
        return Ionicons.close_circle_outline;
      case 'failed':
        return Ionicons.alert_circle_outline;
      default:
        return Ionicons.help_circle_outline;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return tr('common.pending');
      case 'received':
        return tr('common.received');
      case 'cancelled':
        return tr('common.cancelled');
      case 'failed':
        return tr('common.failed');
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<GiftOrder>>(
      stream: _getReceivedGiftOrders(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (snapshot.hasError) {
          print(snapshot.error);
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  tr('common.error_with', {'error': snapshot.error}),
                  style: const TextStyle(color: Colors.white60),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        final giftOrders = snapshot.data ?? [];

        if (giftOrders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(
                  width: 200.0,
                  height: 200.0,
                  child: Lottie.asset("assets/icons/animation-gift.json"),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0, top: 0.0),
                  child: Text(
                    tr('order.no_received_gifts'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14.0,
                      color: Colors.white60,
                      fontFamily: "InterBold",
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            setState(() {});
          },
          child: ListView.builder(
            itemCount: giftOrders.length,
            itemBuilder: (context, index) {
              final giftOrder = giftOrders[index];
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    CupertinoPageRoute(
                      builder: (context) => GiftDetailScreen(
                        giftOrder: giftOrder,
                        userRepository: RepositoryProvider.of<UserRepository>(context),
                      ),
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Container(
                    width: MediaQuery.of(context).size.width,
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8.0),
                      color: CustomColors.darkContainerColor,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 55.0,
                          height: 55.0,
                          padding: const EdgeInsets.all(16.0),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.05),
                          ),
                          child: SvgPicture.asset(
                            "assets/icons/gift-line.svg",
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 16.0),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                tr('order.received_gift_list_desc', {
                                  'phone': giftOrder.sender.phone,
                                  'name': giftOrder.sender.fullName,
                                  'qty': giftOrder.quantity,
                                  'unit': giftOrder.metalId == 1
                                      ? tr('common.gram_gold')
                                      : tr('common.lan_silver')
                                }),
                                style: const TextStyle(
                                  fontSize: 11.0,
                                  fontFamily: "InterBold",
                                ),
                              ),
                              if (giftOrder.greeting != null && giftOrder.greeting!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4.0),
                                  child: Text(
                                    '"${giftOrder.greeting}"',
                                    style: const TextStyle(
                                      fontSize: 10.0,
                                      color: Colors.white60,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 6.0),
                              Row(
                                children: [
                                  Icon(
                                    _getStatusIcon(giftOrder.status),
                                    color: _getStatusColor(giftOrder.status),
                                    size: 14.0,
                                  ),
                                  const SizedBox(width: 4.0),
                                  Text(
                                    _getStatusText(giftOrder.status),
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10.0,
                                      color: _getStatusColor(giftOrder.status),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    DateFormat('MM/dd HH:mm').format(giftOrder.createdAt),
                                    style: const TextStyle(
                                      fontSize: 10.0,
                                      color: Colors.white38,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
