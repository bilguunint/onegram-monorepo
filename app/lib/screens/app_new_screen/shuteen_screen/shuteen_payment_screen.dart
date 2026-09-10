import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lottie/lottie.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/deeplink.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_certificate_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Нэгжийн QPay invoice дэлгэц. `pending_invoices/{pendingId}`-г ажиглаж,
/// backend гэрчилгээ үүсгэмэгц амжилтын төлөв рүү шилжинэ.
class ShuteenPaymentScreen extends StatefulWidget {
  final String pendingId;
  final int amount;
  final int units;
  final MakeOrder invoice;

  const ShuteenPaymentScreen({
    super.key,
    required this.pendingId,
    required this.amount,
    required this.units,
    required this.invoice,
  });

  @override
  State<ShuteenPaymentScreen> createState() => _ShuteenPaymentScreenState();
}

class _ShuteenPaymentScreenState extends State<ShuteenPaymentScreen> {
  bool _done = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    // QPay callback best-effort тул 5 секунд тутам өөрөө шалгана.
    _poll = Timer.periodic(const Duration(seconds: 5), (_) => _verify());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_done) return;
    try {
      await http
          .get(Uri.parse(
              '${ShuteenRepository.callbackUrl}?pending_id=${widget.pendingId}'))
          .timeout(const Duration(seconds: 20));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('shuteen.payment_title')),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('pending_invoices')
            .doc(widget.pendingId)
            .snapshots(),
        builder: (context, snapshot) {
          final data = snapshot.data?.data();
          final processed = data?['status'] == 'processed';
          if (processed && !_done) {
            _done = true;
            _poll?.cancel();
          }
          if (processed) {
            return _PaidView(
              amount: widget.amount,
              units: widget.units,
              orderId: data?['shuteen_order_id'] as String?,
              onClose: _close,
            );
          }
          return _PendingView(invoice: widget.invoice, amount: widget.amount);
        },
      ),
    );
  }

  void _close() {
    // Төлбөр + нэгж сонгох дэлгэцийг хаагаад танилцуулга руу буцна.
    Navigator.of(context).pop();
    if (mounted && Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }
}

class _PendingView extends StatelessWidget {
  final MakeOrder invoice;
  final int amount;
  const _PendingView({required this.invoice, required this.amount});

  Uint8List? _decodeQr() {
    if (invoice.qrImage.isEmpty) return null;
    try {
      return base64Decode(invoice.qrImage);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final qr = _decodeQr();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr('common.amount_due'), style: AppText.caption),
              const SizedBox(height: 6),
              Text(formatMNT(amount),
                  style: AppText.display.copyWith(fontSize: 30)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (qr != null) ...[
          Center(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Image.memory(qr,
                  width: 220, height: 220, fit: BoxFit.contain),
            ),
          ),
          const SizedBox(height: 12),
        ],
        AppBanner(
          icon: Icons.verified_outlined,
          text: tr('shuteen.payment_auto_note'),
          trailing: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: CustomColors.accent),
          ),
        ),
        const SizedBox(height: 20),
        Text(tr('common.bank_app'), style: AppText.sectionTitle),
        const SizedBox(height: 12),
        if (invoice.links.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(tr('common.scan_qr_hint'),
                style: AppText.caption, textAlign: TextAlign.center),
          )
        else
          _BankList(links: invoice.links),
      ],
    );
  }
}

class _BankList extends StatelessWidget {
  final List<DeeplinkModel> links;
  const _BankList({required this.links});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          for (int i = 0; i < links.length; i++) ...[
            if (i > 0) const AppDivider(vertical: 0),
            AppListRow(
              title: links[i].description,
              leading: _BankLogo(url: links[i].logo),
              onTap: () => launchUrl(Uri.parse(links[i].deeplink)),
            ),
          ],
        ],
      ),
    );
  }
}

class _BankLogo extends StatelessWidget {
  final String url;
  const _BankLogo({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) return _fallback();
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 44,
        height: 44,
        child: Image.network(url,
            fit: BoxFit.cover, errorBuilder: (_, __, ___) => _fallback()),
      ),
    );
  }

  Widget _fallback() => const AppIconTile(
        size: 44,
        child: Icon(Icons.account_balance_rounded,
            color: Colors.white24, size: 22),
      );
}

class _PaidView extends StatelessWidget {
  final int amount;
  final int units;
  final String? orderId;
  final VoidCallback onClose;

  const _PaidView({
    required this.amount,
    required this.units,
    required this.orderId,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: IgnorePointer(
            child: Lottie.asset(
              'assets/icons/golden-confetti.json',
              fit: BoxFit.cover,
              repeat: false,
            ),
          ),
        ),
        SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: CustomColors.accentSoft,
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: CustomColors.accent.withOpacity(0.4)),
                    ),
                    child: Icon(Icons.workspace_premium_rounded,
                        color: CustomColors.accent, size: 52),
                  ),
                  const SizedBox(height: 20),
                  Text(tr('shuteen.paid_title'),
                      textAlign: TextAlign.center, style: AppText.title),
                  const SizedBox(height: 6),
                  Text(
                    '${tr('shuteen.units_value', {'n': units})} · ${formatMNT(amount)}',
                    textAlign: TextAlign.center,
                    style: AppText.bodyBold
                        .copyWith(color: CustomColors.accent, fontSize: 15),
                  ),
                  const SizedBox(height: 18),
                  Text(tr('shuteen.paid_body'),
                      textAlign: TextAlign.center,
                      style:
                          AppText.body.copyWith(fontSize: 13, height: 1.55)),
                  const SizedBox(height: 26),
                  if (orderId != null) ...[
                    SizedBox(
                      width: 240,
                      child: AppPrimaryButton(
                        label: tr('shuteen.view_certificate'),
                        icon: Icons.qr_code_2_rounded,
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                ShuteenCertificateScreen(orderId: orderId!),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                  SizedBox(
                    width: 240,
                    child: AppPrimaryButton(
                      label: tr('common.ok'),
                      outlined: true,
                      onPressed: onClose,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
