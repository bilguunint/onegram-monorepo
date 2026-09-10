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

/// QPay invoice viewer for **direct** (full-price) purchases.
///
/// Subscribes to `pending_invoices/{pendingId}` — when the backend callback
/// sets `status == "processed"` (after QPay confirms PAID), the UI flips to
/// a success state and auto-pops back to the caller.
class DirectPurchasePaymentScreen extends StatefulWidget {
  final String pendingId;
  final int amount;
  final MakeOrder invoice;
  final String productName;

  /// Title shown in the AppBar. Defaults to the translated
  /// "Шууд худалдан авалт".
  final String? appBarTitleKey;

  /// Title shown in the success dialog. Defaults to the translated
  /// "Худалдан авалт амжилттай".
  final String? successTitleKey;

  /// Body text shown in the success dialog. Defaults to a generic message.
  /// Built with `productName` + formatted amount so callers usually want to
  /// pass a custom string for installment-init.
  final String? successMessageKey;
  final Map<String, Object?>? successMessageParams;

  const DirectPurchasePaymentScreen({
    super.key,
    required this.pendingId,
    required this.amount,
    required this.invoice,
    required this.productName,
    this.appBarTitleKey,
    this.successTitleKey,
    this.successMessageKey,
    this.successMessageParams,
  });

  @override
  State<DirectPurchasePaymentScreen> createState() =>
      _DirectPurchasePaymentScreenState();
}

class _DirectPurchasePaymentScreenState
    extends State<DirectPurchasePaymentScreen> {
  bool _alreadyPopped = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr(widget.appBarTitleKey ?? 'purchase.direct_purchase')),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('pending_invoices')
            .doc(widget.pendingId)
            .snapshots(),
        builder: (context, snapshot) {
          final data = snapshot.data?.data();
          final isProcessed = data?['status'] == 'processed';

          if (isProcessed && !_alreadyPopped) {
            _alreadyPopped = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) _showSuccessAndPop();
            });
          }

          if (isProcessed) {
            return _PaidView(
              amount: widget.amount,
              productName: widget.productName,
              onClose: _popBack,
            );
          }

          return _PendingView(
            invoice: widget.invoice,
            amount: widget.amount,
            productName: widget.productName,
          );
        },
      ),
    );
  }

  /// Pop the payment screen + the underlying product detail screen so the
  /// user lands back at the products grid.
  void _popBack() {
    if (mounted) {
      Navigator.of(context).pop();
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
    }
  }

  void _showSuccessAndPop() async {
    if (!mounted) return;
    // Resolved here, not by the caller, so a live language switch is picked up.
    final message = widget.successMessageKey != null
        ? tr(widget.successMessageKey!, widget.successMessageParams)
        : tr('purchase.purchase_success_body', {
            'product': widget.productName,
            'amount': formatMNT(widget.amount),
          });
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AppDialog(
        icon: Icons.check_rounded,
        iconColor: CustomColors.positive,
        title: tr(widget.successTitleKey ?? 'purchase.purchase_success'),
        message: message,
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
  final String productName;

  const _PendingView({
    required this.invoice,
    required this.amount,
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
              Text(productName, style: AppText.caption),
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
          text: tr('purchase.auto_refresh_hint'),
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
        // No canLaunchUrl gate — see installment_payment_screen.dart.
        launchUrl(Uri.parse(link.deeplink));
      },
    );
  }
}

class _PaidView extends StatelessWidget {
  final int amount;
  final String productName;
  final VoidCallback onClose;

  const _PaidView({
    required this.amount,
    required this.productName,
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
              tr('purchase.purchase_success'),
              textAlign: TextAlign.center,
              style: AppText.sectionTitle,
            ),
            const SizedBox(height: 6),
            Text(
              '$productName • ${formatMNT(amount)}',
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
