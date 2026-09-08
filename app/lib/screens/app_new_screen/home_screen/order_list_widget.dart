import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Захиалгын түүх — огноогоор бүлэглэсэн flat жагсаалт
/// (Radianpay-ийн "Transaction history" маяг).
class OrderList extends StatefulWidget {
  const OrderList({super.key});

  @override
  State<OrderList> createState() => _OrderListState();
}

class _OrderListState extends State<OrderList> {
  final currencyFormatter = NumberFormat();

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
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: _ordersStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CupertinoActivityIndicator();
        }
        if (snapshot.hasError) {
          return _buildErrorWidget();
        }
        final docs = snapshot.data?.docs ?? [];
        // Filter: hide payment_status == 'pending'
        final filtered = docs
            .where((d) =>
                (d.data()['payment_status']?.toString() ?? '').toLowerCase() !=
                'pending')
            .toList();
        if (filtered.isEmpty) {
          return _buildErrorWidget();
        }
        return _buildHistory(filtered);
      },
    );
  }

  Widget _buildErrorWidget() {
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
          child: Text(tr('home.no_orders'), style: AppText.caption),
        ),
      ],
    ));
  }

  Widget _buildHistory(List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
    final List<Widget> children = [];
    String? currentGroup;

    for (int i = 0; i < docs.length; i++) {
      final data = docs[i].data();
      final DateTime? date = _toDate(data['created_at']);
      final String group = _dateKey(date);

      if (group != currentGroup) {
        currentGroup = group;
        children.add(Padding(
          padding: EdgeInsets.only(top: i == 0 ? 0.0 : 20.0, bottom: 10.0),
          child: Text(
            _dateLabel(date),
            style: TextStyle(
              fontFamily: AppText.medium,
              fontSize: 13.0,
              fontWeight: FontWeight.w500,
              color: CustomColors.textSecondary,
            ),
          ),
        ));
      } else {
        children.add(Container(
          height: 1.0,
          margin: const EdgeInsets.symmetric(vertical: 4.0),
          color: CustomColors.surfaceBorder,
        ));
      }
      children.add(_row(data));
    }
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }

  Widget _row(Map<String, dynamic> data) {
    final num amount = _toNum(data['amount']);
    final dynamic quantity = data['quantity'];
    final String prodType =
        (data['prod_type'] ?? data['type'] ?? '').toString();
    final String adminStatus =
        (data['admin_status'] ?? '').toString().toLowerCase();
    final String paymentStatus =
        (data['payment_status'] ?? data['status'] ?? '')
            .toString()
            .toLowerCase();

    final bool isGift = prodType == 'gift';
    final bool isWithdraw = prodType == 'withdraw';
    final bool incoming = !isGift && !isWithdraw;

    // Төрлөөр icon, гарчиг, өнгө
    final String asset = isGift
        ? "assets/icons/gift-line.svg"
        : isWithdraw
            ? "assets/icons/cash.svg"
            : "assets/icons/gold-bar.svg";
    final String title = isGift
        ? tr('home.order_type_gift')
        : isWithdraw
            ? tr('home.order_type_withdraw')
            : tr('home.order_type_deposit');
    final Color iconColor = isGift
        ? const Color(0xFFB48CFF)
        : isWithdraw
            ? const Color(0xFF4FC3F7)
            : CustomColors.accent;

    // Төлөв: admin success -> амжилттай; refund -> цуцлагдсан; payment success -> хүлээгдэж байна
    String statusText;
    Color statusColor;
    if (adminStatus == 'success') {
      statusText = tr('common.success');
      statusColor = CustomColors.textSecondary;
    } else if (adminStatus == 'refund') {
      statusText = tr('common.cancelled');
      statusColor = CustomColors.negative;
    } else {
      statusText = tr('common.pending');
      statusColor = paymentStatus == 'success'
          ? CustomColors.accent
          : CustomColors.textSecondary;
    }

    final String grams = tr('home.grams_short', {'quantity': quantity});
    final String amountText = incoming ? "+ $grams" : "− $grams";
    final Color amountColor = adminStatus == 'refund'
        ? CustomColors.textTertiary
        : incoming
            ? CustomColors.positive
            : Colors.white;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          AppIconTile(
            size: 48.0,
            child: Padding(
              padding: const EdgeInsets.all(13.0),
              child: SvgPicture.asset(asset, color: iconColor),
            ),
          ),
          const SizedBox(width: 14.0),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppText.bodyBold),
                const SizedBox(height: 3.0),
                Text(statusText,
                    style: AppText.caption.copyWith(color: statusColor)),
              ],
            ),
          ),
          const SizedBox(width: 12.0),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amountText,
                style: AppText.bodyBold.copyWith(
                  color: amountColor,
                  decoration: adminStatus == 'refund'
                      ? TextDecoration.lineThrough
                      : TextDecoration.none,
                ),
              ),
              const SizedBox(height: 3.0),
              Text(
                "${currencyFormatter.format(amount)}₮",
                style: AppText.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }

  DateTime? _toDate(dynamic v) {
    if (v is Timestamp) return v.toDate();
    if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
    return null;
  }

  String _dateKey(DateTime? d) =>
      d == null ? '' : DateFormat('yyyy-MM-dd').format(d);

  String _dateLabel(DateTime? d) {
    if (d == null) return '';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(d.year, d.month, d.day);
    final String short = DateFormat('MM.dd').format(d);
    if (day == today) return "${tr('home.today')}, $short";
    if (day == today.subtract(const Duration(days: 1))) {
      return "${tr('home.yesterday')}, $short";
    }
    return DateFormat('yyyy.MM.dd').format(d);
  }

  num _toNum(dynamic v) {
    if (v is num) return v;
    if (v is String) return num.tryParse(v) ?? 0;
    return 0;
  }
}
