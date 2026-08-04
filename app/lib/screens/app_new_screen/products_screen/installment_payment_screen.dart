import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          tr('purchase.day_payment_title', {'day': widget.dayLabel}),
          style: const TextStyle(
            fontFamily: 'InterBold',
            fontSize: 13,
            color: Colors.white,
          ),
        ),
        centerTitle: false,
      ),
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

  void _showSuccessAndPop(bool isCompleted) async {
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: const Color(0xFF1F1F22),
        title: Row(
          children: [
            Icon(Icons.check_circle, color: CustomColors.successGreen),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                isCompleted
                    ? tr('purchase.fully_paid_title')
                    : tr('purchase.payment_success_title'),
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
          ],
        ),
        content: Text(
          isCompleted
              ? tr('purchase.fully_paid_body')
              : tr('purchase.day_payment_success_body', {
                  'day': widget.dayLabel,
                  'amount': formatMNT(widget.amount),
                }),
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: Text(tr('purchase.ok'),
                style: TextStyle(color: CustomColors.mainColor)),
          ),
        ],
      ),
    );
    if (mounted) Navigator.of(context).pop();
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
      padding: const EdgeInsets.all(16),
      children: [
        // Amount
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1F1F22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                tr('common.amount_due'),
                style: TextStyle(
                  color: Colors.white.withOpacity(0.55),
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                formatMNT(amount),
                style: TextStyle(
                  color: CustomColors.mainColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 26,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '$productName — $dayLabel',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // QR code
        if (qrBytes != null)
          Center(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Image.memory(
                qrBytes,
                width: 220,
                height: 220,
                fit: BoxFit.contain,
              ),
            ),
          ),

        const SizedBox(height: 16),
        Text(
          tr('common.bank_app'),
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),

        // Bank deeplinks
        if (invoice.links.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              tr('common.scan_qr_hint'),
              style: const TextStyle(color: Colors.white54, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
            ),
            itemCount: invoice.links.length,
            itemBuilder: (context, i) {
              final link = invoice.links[i];
              return GestureDetector(
                onTap: () {
                  // No canLaunchUrl gate — custom bank schemes need to be
                  // declared in iOS LSApplicationQueriesSchemes + Android
                  // <queries> for the check to return true, and we don't
                  // ship those declarations. Mirrors payment_screen.dart.
                  launchUrl(Uri.parse(link.deeplink));
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F1F22),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (link.logo.isNotEmpty)
                        Container(
                          height: 44,
                          width: 44,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            image: DecorationImage(
                              fit: BoxFit.cover,
                              image: NetworkImage(link.logo),
                            ),
                          ),
                        )
                      else
                        const Icon(Icons.account_balance,
                            color: Colors.white54, size: 32),
                      const SizedBox(height: 6),
                      Text(
                        link.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 9,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.amber.withOpacity(0.10),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.amber.withOpacity(0.25)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline,
                  size: 14, color: Colors.amberAccent),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  tr('purchase.auto_refresh_hint_pay'),
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PaidView extends StatelessWidget {
  final int amount;
  final String dayLabel;
  final bool isCompleted;

  const _PaidView({
    required this.amount,
    required this.dayLabel,
    required this.isCompleted,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: CustomColors.successGreen.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_circle,
                color: CustomColors.successGreen,
                size: 64,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              isCompleted
                  ? tr('purchase.fully_paid_title')
                  : tr('purchase.payment_success_title'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$dayLabel • ${formatMNT(amount)}',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
