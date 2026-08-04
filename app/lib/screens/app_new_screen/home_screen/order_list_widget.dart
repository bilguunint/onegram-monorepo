import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import 'package:ionicons/ionicons.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/colors.dart';

class OrderList extends StatefulWidget {
  const OrderList({super.key});

  @override
  State<OrderList> createState() => _OrderListState();
}

class _OrderListState extends State<OrderList> {
  final currencyFormatter = NumberFormat();
  var inputFormat = DateFormat('dd/MM/yyyy HH:mm');
  var outputFormat = DateFormat('MM/dd/yyyy hh:mm a');

  Stream<QuerySnapshot<Map<String, dynamic>>> _ordersStream() {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    if (uid.isEmpty) {
      return const Stream.empty();
    }
    try {
      return FirebaseFirestore.instance
          .collection('orders')
          .where('user_id', isEqualTo: uid)
          .orderBy('created_at', descending: true)
          .snapshots();
    } catch (_) {
      // if index/orderBy not available, still return empty instead of crashing UI
      return FirebaseFirestore.instance
          .collection('orders')
          .where('user_id', isEqualTo: uid)
          .snapshots();
    }
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: _ordersStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CupertinoActivityIndicator();
        }
        if (snapshot.hasError) {
          print(snapshot.error);
          return _buildErrorWidget('error');
        }
        final docs = snapshot.data?.docs ?? [];
        // Filter: hide payment_status == 'pending'
        final filtered = docs.where((d) => (d.data()['payment_status']?.toString() ?? '').toLowerCase() != 'pending').toList();
        if (filtered.isEmpty) {
          return _buildErrorWidget('empty');
        }
        return _buildHomeWidget(filtered);
      },
    );
  }

  Widget _buildErrorWidget(String error) {
    print(error);
    return Center(
        child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
            width: 80.0,
            height: 80.0,
            child: SvgPicture.asset("assets/icons/no-order-dark.svg")),
        Padding(
          padding: const EdgeInsets.only(top: 16.0),
          child: Text(
            tr('home.no_orders'),
            style: const TextStyle(
                fontSize: 12.0,
                color: Colors.white38,
                fontWeight: FontWeight.bold),
          ),
        ),
      ],
    ));
  }

  Widget _buildHomeWidget(List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
    return Column(
      children: List<Widget>.generate(docs.length, (index) {
        final data = docs[index].data();
        final amount = _toNum(data['amount']);
        final quantity = data['quantity'];
        final prodType = (data['prod_type'] ?? data['type'] ?? '').toString();
        final adminStatus = (data['admin_status'] ?? '').toString();
        final paymentStatus = (data['payment_status'] ?? data['status'] ?? '').toString();
        final createdAt = _formatDate(data['created_at']);

        // Icon by type
        final Widget leadingIcon = prodType == 'gift'
            ? SvgPicture.asset("assets/icons/gift-line.svg", color: Colors.white)
            : prodType == 'withdraw'
                ? SvgPicture.asset("assets/icons/cash.svg", color: Colors.white)
                : SvgPicture.asset("assets/icons/gold-bar.svg", color: Colors.white);

        // Status mapping per requirement:
        // - payment_status: success -> show "Хүлээгдэж байна"
        // - admin_status: success -> show "Амжилттай"
        // Priority: if admin_status == success -> success; else if payment_status == success -> pending
        String statusText;
        Color statusColor;
        IconData statusIcon;
        if (adminStatus.toLowerCase() == 'success') {
          statusText = tr('common.success');
          statusColor = CustomColors.successGreen;
          statusIcon = Ionicons.checkmark_circle_outline;
        } else if (adminStatus.toLowerCase() == 'refund') {
          statusText = tr('common.cancelled');
          statusColor = CustomColors.alerRed;
          statusIcon = Ionicons.close_circle_outline;
        } else if (paymentStatus.toLowerCase() == 'success') {
          statusText = tr('common.pending');
          statusColor = CustomColors.textGrey;
          statusIcon = Ionicons.time_outline;
        } else {
          // fallback
          statusText = tr('common.pending');
          statusColor = CustomColors.textGrey;
          statusIcon = Ionicons.time_outline;
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Container(
            padding: const EdgeInsets.all(8.0),
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8.0),
                color: CustomColors.darkContainerColor),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 50.0,
                      height: 50.0,
                      padding: const EdgeInsets.all(14.0),
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.05)),
                      child: leadingIcon,
                    ),
                    const SizedBox(width: 16.0),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "${currencyFormatter.format(amount)}₮",
                          style: const TextStyle(
                              fontSize: 12.0, fontFamily: "InterBold"),
                        ),
                        const SizedBox(height: 6.0),
                        Row(
                          children: [
                            Icon(statusIcon, color: statusColor, size: 14.0),
                            const SizedBox(width: 4.0),
                            Text(
                              statusText,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 10.0,
                                color: statusColor,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 4.0),
                  child: Column(
                    children: [
                      Text(
                        tr('home.grams_short', {'quantity': quantity}),
                        style: TextStyle(
                            fontSize: 12.0,
                            fontFamily: "InterBold",
                            color: CustomColors.mainColor),
                      ),
                      const SizedBox(height: 6.0),
                      Text(
                        createdAt,
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 9.0,
                            color: CustomColors.textGrey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  String _formatDate(dynamic v) {
    try {
      if (v is Timestamp) {
        return DateFormat('yyyy-MM-dd').format(v.toDate());
      }
      if (v is String && v.isNotEmpty) {
        // Try parse ISO or fallback
        final dt = DateTime.tryParse(v);
        if (dt != null) {
          return DateFormat('yyyy-MM-dd').format(dt);
        }
      }
    } catch (_) {}
    return '';
  }

  num _toNum(dynamic v) {
    if (v is num) return v;
    if (v is String) return num.tryParse(v) ?? 0;
    return 0;
  }
}