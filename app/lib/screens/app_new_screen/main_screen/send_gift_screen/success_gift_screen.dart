import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/models/gift_order_model.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';

class SuccessGiftScreen extends StatefulWidget {
  const SuccessGiftScreen({
    super.key,
    required this.giftId,
  });
  final String giftId;

  @override
  State<SuccessGiftScreen> createState() => _SuccessGiftScreenState();
}

class _SuccessGiftScreenState extends State<SuccessGiftScreen> {
  final currencyFormatter = NumberFormat();
  
  Stream<GiftOrder?> watchGiftOrderById(String giftId) {
  return FirebaseFirestore.instance
      .doc('gift_orders/$giftId')
      .snapshots()
      .map((snap) => snap.exists ? GiftOrder.fromMap(snap.id, snap.data()!) : null)
      .handleError((e) {
        print('Error watching gift order: $e');
        return null;
      });
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('order.send_gift_request_title')),
        centerTitle: false,
        backgroundColor: CustomColors.scaffoldDarkBack,
      ),
      backgroundColor: CustomColors.scaffoldDarkBack,
      body: StreamBuilder<GiftOrder?>(
        stream: watchGiftOrderById(widget.giftId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    tr('order.gift_loading'),
                    style: const TextStyle(
                        fontSize: 14.0, color: Colors.white60),
                  ),
                ],
              ),
            );
          }
          
          if (snapshot.hasError) {
            return Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
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
                          tr('order.gift_load_error'),
                          style: const TextStyle(
                              fontSize: 18.0, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Gift ID: ${widget.giftId}",
                          style: const TextStyle(fontSize: 14.0, color: Colors.white60),
                        ),
                      ],
                    ),
                  ),
                  SafeArea(
                    child: Row(
                      children: [
                        Expanded(
                          child: MainButton(
                            title: Text(
                              tr('common.back'),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold, 
                                color: Colors.black
                              ),
                            ),
                            onPress: () => Navigator.pop(context),
                            isLoading: false,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }
          
          if (!snapshot.hasData) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    tr('order.gift_waiting_create'),
                    style: const TextStyle(
                        fontSize: 14.0, color: Colors.white60),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    tr('order.gift_may_take_seconds'),
                    style: const TextStyle(
                        fontSize: 12.0, color: Colors.white38),
                  ),
                ],
              ),
            );
          }
          
          final giftOrder = snapshot.data!;
          
          return Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    children: [
                      SizedBox(
                        width: 200.0,
                        height: 200.0,
                        child: Lottie.asset("assets/icons/animation-gift.json"),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16.0, top: 0.0),
                        child: Text(
                          tr('order.gift_sent_success'),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              fontSize: 18.0, fontFamily: "InterBold"),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 32.0),
                        child: Text(
                          tr('order.gift_sent_success_desc', {
                            'phone': giftOrder.receiver.phone,
                            'qty': giftOrder.quantity,
                            'metal': giftOrder.metalId == 1
                                ? tr('order.metal_gold')
                                : tr('order.metal_silver')
                          }),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14.0,
                            color: Colors.white60,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16.0),
                      
                      // Gift ID
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('order.gift_id_label'),
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14.0),
                          ),
                          Text(
                            giftOrder.giftId,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                              color: CustomColors.mainColor,
                            ),
                          )
                        ],
                      ),
                      const SizedBox(height: 16.0),
                      
                      // Receiver phone
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('order.recipient_label'),
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14.0),
                          ),
                          Text(
                            giftOrder.receiver.phone,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                              color: CustomColors.mainColor,
                            ),
                          )
                        ],
                      ),
                      const SizedBox(height: 16.0),
                      
                      // Greeting
                      if (giftOrder.greeting != null && giftOrder.greeting!.isNotEmpty)
                        Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  tr('order.greeting_label'),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14.0),
                                ),
                                Flexible(
                                  child: Text(
                                    giftOrder.greeting!,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14.0,
                                      color: CustomColors.mainColor,
                                    ),
                                    textAlign: TextAlign.end,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                )
                              ],
                            ),
                            const SizedBox(height: 16.0),
                          ],
                        ),
                      
                      // Quantity
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('order.gift_quantity_label'),
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14.0),
                          ),
                          Text(
                            giftOrder.metalId == 1
                                ? tr('order.quantity_gram',
                                    {'qty': giftOrder.quantity})
                                : tr('order.quantity_lan',
                                    {'qty': giftOrder.quantity}),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: CustomColors.mainColor,
                            ),
                          )
                        ],
                      ),
                      const SizedBox(height: 16.0),
                      
                      // Amount (if available)
                      if (giftOrder.amount != null)
                        Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  tr('order.amount_label'),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14.0),
                                ),
                                Text(
                                  "${currencyFormatter.format(giftOrder.amount)}₮",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14.0,
                                    color: CustomColors.mainColor,
                                  ),
                                )
                              ],
                            ),
                            const SizedBox(height: 16.0),
                          ],
                        ),
                      
                      // Created date
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('order.sent_date_label'),
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14.0),
                          ),
                          Text(
                            DateFormat('yyyy-MM-dd HH:mm').format(giftOrder.createdAt),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                              color: CustomColors.mainColor,
                            ),
                          )
                        ],
                      ),
                      const SizedBox(height: 16.0),
                      
                      // Status
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            tr('order.status_label'),
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14.0),
                          ),
                          Text(
                            _getStatusText(giftOrder.status),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                              color: _getStatusColor(giftOrder.status),
                            ),
                          )
                        ],
                      ),
                    ],
                  ),
                ),
                SafeArea(
                  child: Row(
                    children: [
                      Expanded(
                        child: MainButton(
                          title: Text(
                            tr('order.understood'),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold, 
                              color: Colors.black,
                            ),
                          ),
                          onPress: () => Navigator.pop(context),
                          isLoading: false,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return tr('order.status_pending_short');
      case 'completed':
        return tr('common.success');
      case 'cancelled':
        return tr('common.cancelled');
      case 'failed':
        return tr('common.failed');
      default:
        return status;
    }
  }
  
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      case 'failed':
        return Colors.red;
      default:
        return CustomColors.mainColor;
    }
  }
}