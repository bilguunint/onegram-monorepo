import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/deeplink.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

/// Screen that displays the QPay invoice for an installment payment covering
/// one or more days ([dayFrom]…[dayTo]).
///
/// Listens to the purchase doc in Firestore; once the backend callback credits
/// the bundle (paid_days reaches [dayTo]), the UI flips to a "Төлсөн" success
/// state.
class InstallmentPaymentScreen extends StatefulWidget {
  final String purchaseId;
  final int dayFrom;
  final int dayTo;
  final int amount;
  final MakeOrder invoice;
  final String productName;

  const InstallmentPaymentScreen({
    super.key,
    required this.purchaseId,
    required this.dayFrom,
    required this.dayTo,
    required this.amount,
    required this.invoice,
    required this.productName,
  });

  /// Human label for the day range — "5-р өдөр" for a single day, or
  /// "5–11-р өдөр" for a multi-day bundle.
  String get dayLabel => dayFrom == dayTo
      ? tr('purchase.day_single', {'day': dayFrom})
      : tr('purchase.day_range', {'from': dayFrom, 'to': dayTo});

  @override
  State<InstallmentPaymentScreen> createState() =>
      _InstallmentPaymentScreenState();
}

class _InstallmentPaymentScreenState extends State<InstallmentPaymentScreen> {
  bool _alreadyPopped = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar:
          appBar(tr('purchase.day_payment_title', {'day': widget.dayLabel})),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('product_purchases')
            .doc(widget.purchaseId)
            .snapshots(),
        builder: (context, snapshot) {
          final data = snapshot.data?.data();
          final paidDays = (data?['paid_days'] as num?)?.toInt() ?? 0;
          final purchaseStatus = data?['status'] as String?;
          final isPaid = paidDays >= widget.dayTo;
          final isCompleted = purchaseStatus == 'completed' ||
              purchaseStatus == 'delivered';

          // Auto-close once the bundle becomes paid so the user lands back on
          // the detail screen with the updated progress.
          if (isPaid && !_alreadyPopped) {
            _alreadyPopped = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) _showSuccessAndPop(isCompleted);
            });
          }

          if (isPaid) {
            return _PaidView(
              amount: widget.amount,
              dayLabel: widget.dayLabel,
              isCompleted: isCompleted,
              onClose: _popBack,
            );
          }

          return _PendingView(
            invoice: widget.invoice,
            amount: widget.amount,
            dayLabel: widget.dayLabel,
            productName: widget.productName,
          );
        },
      ),
    );
  }

  void _popBack() {
    if (mounted) Navigator.of(context).pop();
  }

  void _showSuccessAndPop(bool isCompleted) async {
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AppDialog(
        icon: Icons.check_rounded,
        iconColor: CustomColors.positive,
        title: isCompleted
            ? tr('purchase.fully_paid_title')
            : tr('purchase.payment_success_title'),
        message: isCompleted
            ? tr('purchase.fully_paid_body')
            : tr('purchase.day_payment_success_body', {
                'day': widget.dayLabel,
                'amount': formatMNT(widget.amount),
              }),
        primaryLabel: tr('purchase.ok'),
        onPrimary: () => Navigator.of(dialogCtx).pop(),
      ),
    );
    _popBack();
  }
}

class _PendingView extends StatelessWidget {
  final MakeOrder invoice;
  final int amount;
  final String dayLabel;
  final String productName;

  const _PendingView({
    required this.invoice,
    required this.amount,
    required this.dayLabel,
    required this.productName,
  });

  Uint8List? _decodeQrImage() {
    if (invoice.qrImage.isEmpty) return null;
    try {
      return base64Decode(invoice.qrImage);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final qrBytes = _decodeQrImage();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        // Amount
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr('common.amount_due'), style: AppText.caption),
              const SizedBox(height: 6),
              Text(
                formatMNT(amount),
                style: AppText.display.copyWith(fontSize: 30),
              ),
              const SizedBox(height: 6),
              Text('$productName — $dayLabel', style: AppText.caption),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // QR code
        if (qrBytes != null) ...[
          AppCard(
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Image.memory(
                  qrBytes,
                  width: 220,
                  height: 220,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Waiting for the backend callback
        AppBanner(
          text: tr('purchase.auto_refresh_hint_pay'),
          trailing: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: CustomColors.accent),
          ),
        ),

        const SizedBox(height: 24),
        Text(tr('common.bank_app'), style: AppText.sectionTitle),
        const SizedBox(height: 12),

        // Bank deeplinks
        if (invoice.links.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              tr('common.scan_qr_hint'),
              style: AppText.caption,
              textAlign: TextAlign.center,
            ),
          )
        else
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Column(
              children: [
                for (int i = 0; i < invoice.links.length; i++) ...[
                  if (i > 0) const AppDivider(vertical: 0),
                  _BankRow(link: invoice.links[i]),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

/// Банкны апп руу үсрэх нэг мөр — лого tile, нэр, chevron.
class _BankRow extends StatelessWidget {
  final DeeplinkModel link;
  const _BankRow({required this.link});

  @override
  Widget build(BuildContext context) {
    return AppListRow(
      title: link.description,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 44,
          height: 44,
          color: CustomColors.surfaceAlt,
          child: link.logo.isNotEmpty
              ? Image.network(
                  link.logo,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Icon(
                      Icons.account_balance_rounded,
                      color: Colors.white24,
                      size: 22),
                )
              : const Icon(Icons.account_balance_rounded,
                  color: Colors.white24, size: 22),
        ),
      ),
      trailing: Icon(Icons.chevron_right_rounded,
          size: 20, color: CustomColors.textSecondary),
      onTap: () {
        // No canLaunchUrl gate — custom bank schemes need to be
        // declared in iOS LSApplicationQueriesSchemes + Android
        // <queries> for the check to return true, and we don't
        // ship those declarations. Mirrors payment_screen.dart.
        launchUrl(Uri.parse(link.deeplink));
      },
    );
  }
}

class _PaidView extends StatelessWidget {
  final int amount;
  final String dayLabel;
  final bool isCompleted;
  final VoidCallback onClose;

  const _PaidView({
    required this.amount,
    required this.dayLabel,
    required this.isCompleted,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppIconTile(
              size: 72,
              child: Icon(Icons.check_rounded,
                  size: 34, color: CustomColors.positive),
            ),
            const SizedBox(height: 16),
            Text(
              isCompleted
                  ? tr('purchase.fully_paid_title')
                  : tr('purchase.payment_success_title'),
              textAlign: TextAlign.center,
              style: AppText.sectionTitle,
            ),
            const SizedBox(height: 6),
            Text(
              '$dayLabel • ${formatMNT(amount)}',
              textAlign: TextAlign.center,
              style: AppText.caption,
            ),
            const SizedBox(height: 24),
            AppPrimaryButton(label: tr('common.close'), onPressed: onClose),
          ],
        ),
      ),
    );
  }
}
