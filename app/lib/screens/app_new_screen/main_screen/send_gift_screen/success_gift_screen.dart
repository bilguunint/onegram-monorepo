import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/models/gift_order_model.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
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
        .map((snap) =>
            snap.exists ? GiftOrder.fromMap(snap.id, snap.data()!) : null)
        .handleError((e) {
      print('Error watching gift order: $e');
      return null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('order.send_gift_request_title')),
      body: StreamBuilder<GiftOrder?>(
        stream: watchGiftOrderById(widget.giftId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _waiting(tr('order.gift_loading'));
          }

          if (snapshot.hasError) {
            return Column(
              children: [
                Expanded(
                  child: AppEmptyState(
                    icon: Icons.error_outline_rounded,
                    iconColor: CustomColors.negative,
                    title: tr('order.gift_load_error'),
                    subtitle: "Gift ID: ${widget.giftId}",
                  ),
                ),
                _bottomButton(
                  label: tr('common.back'),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            );
          }

          if (!snapshot.hasData) {
            return _waiting(
              tr('order.gift_waiting_create'),
              hint: tr('order.gift_may_take_seconds'),
            );
          }

          final giftOrder = snapshot.data!;

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    Center(
                      child: SizedBox(
                        width: 160.0,
                        height: 160.0,
                        child:
                            Lottie.asset("assets/icons/animation-gift.json"),
                      ),
                    ),
                    const SizedBox(height: 8.0),
                    Text(
                      tr('order.gift_sent_success'),
                      textAlign: TextAlign.center,
                      style: AppText.title,
                    ),
                    const SizedBox(height: 8.0),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Text(
                        tr('order.gift_sent_success_desc', {
                          'phone': giftOrder.receiver.phone,
                          'qty': giftOrder.quantity,
                          'metal': giftOrder.metalId == 1
                              ? tr('order.metal_gold')
                              : tr('order.metal_silver')
                        }),
                        textAlign: TextAlign.center,
                        style: AppText.caption.copyWith(fontSize: 13.0),
                      ),
                    ),
                    const SizedBox(height: 24.0),
                    // Хүлээн авагчийн урьдчилсан харагдац
                    AppCard(
                      child: Row(
                        children: [
                          AppIconTile(
                            child: Icon(Icons.person_rounded,
                                size: 22.0, color: CustomColors.accent),
                          ),
                          const SizedBox(width: 12.0),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  giftOrder.receiver.fullName.trim().isNotEmpty
                                      ? giftOrder.receiver.fullName
                                      : tr('order.recipient_label'),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.bodyBold,
                                ),
                                const SizedBox(height: 3.0),
                                Text(giftOrder.receiver.phone,
                                    style: AppText.caption),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10.0),
                          Text(
                            giftOrder.metalId == 1
                                ? tr('order.quantity_gram',
                                    {'qty': giftOrder.quantity})
                                : tr('order.quantity_lan',
                                    {'qty': giftOrder.quantity}),
                            style: AppText.bodyBold
                                .copyWith(color: CustomColors.accent),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12.0),
                    AppCard(
                      child: Column(
                        children: [
                          AppInfoRow(
                            label: tr('order.gift_id_label'),
                            value: giftOrder.giftId,
                            valueColor: CustomColors.accent,
                          ),
                          const AppDivider(),
                          AppInfoRow(
                            label: tr('order.recipient_label'),
                            value: giftOrder.receiver.phone,
                          ),
                          if (giftOrder.greeting != null &&
                              giftOrder.greeting!.isNotEmpty) ...[
                            const AppDivider(),
                            AppInfoRow(
                              label: tr('order.greeting_label'),
                              value: giftOrder.greeting!,
                            ),
                          ],
                          const AppDivider(),
                          AppInfoRow(
                            label: tr('order.gift_quantity_label'),
                            value: giftOrder.metalId == 1
                                ? tr('order.quantity_gram',
                                    {'qty': giftOrder.quantity})
                                : tr('order.quantity_lan',
                                    {'qty': giftOrder.quantity}),
                          ),
                          if (giftOrder.amount != null) ...[
                            const AppDivider(),
                            AppInfoRow(
                              label: tr('order.amount_label'),
                              value:
                                  "${currencyFormatter.format(giftOrder.amount)}₮",
                            ),
                          ],
                          const AppDivider(),
                          AppInfoRow(
                            label: tr('order.sent_date_label'),
                            value: DateFormat('yyyy-MM-dd HH:mm')
                                .format(giftOrder.createdAt),
                          ),
                          const AppDivider(),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(vertical: 7.0),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(tr('order.status_label'),
                                      style: AppText.caption
                                          .copyWith(fontSize: 13.0)),
                                ),
                                AppStatusChip(
                                  label: _getStatusText(giftOrder.status),
                                  color: _getStatusColor(giftOrder.status),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              _bottomButton(
                label: tr('order.understood'),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _waiting(String text, {String? hint}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 28.0,
            height: 28.0,
            child: CircularProgressIndicator(
                color: CustomColors.accent, strokeWidth: 2.0),
          ),
          const SizedBox(height: 16),
          Text(text,
              textAlign: TextAlign.center,
              style: AppText.body.copyWith(color: CustomColors.textSecondary)),
          if (hint != null) ...[
            const SizedBox(height: 6),
            Text(hint,
                textAlign: TextAlign.center,
                style: AppText.caption.copyWith(color: CustomColors.textTertiary)),
          ],
        ],
      ),
    );
  }

  Widget _bottomButton(
      {required String label, required VoidCallback onPressed}) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: AppPrimaryButton(label: label, onPressed: onPressed),
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
        return CustomColors.accent;
      case 'completed':
        return CustomColors.positive;
      case 'cancelled':
        return CustomColors.negative;
      case 'failed':
        return CustomColors.negative;
      default:
        return CustomColors.textSecondary;
    }
  }
}
