import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lottie/lottie.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/deeplink.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

/// QPay invoice viewer for a tree-planting order. Subscribes to
/// `pending_invoices/{pendingId}`; when the backend records the order the UI
/// flips to a celebratory "таны мод таригдана" state.
class TreePaymentScreen extends StatefulWidget {
  final String pendingId;
  final int amount;
  final MakeOrder invoice;
  final String labelName;
  final String treeName;

  const TreePaymentScreen({
    super.key,
    required this.pendingId,
    required this.amount,
    required this.invoice,
    required this.labelName,
    required this.treeName,
  });

  @override
  State<TreePaymentScreen> createState() => _TreePaymentScreenState();
}

class _TreePaymentScreenState extends State<TreePaymentScreen> {
  static const _callbackUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/treeOrderCallback';

  bool _done = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    // QPay's callback is best-effort; actively re-verify every few seconds so
    // a dropped callback still confirms the payment while the user waits.
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
          .get(Uri.parse('$_callbackUrl?pending_id=${widget.pendingId}'))
          .timeout(const Duration(seconds: 20));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('center.tree_payment_title')),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('pending_invoices')
            .doc(widget.pendingId)
            .snapshots(),
        builder: (context, snapshot) {
          final processed = snapshot.data?.data()?['status'] == 'processed';
          if (processed && !_done) {
            _done = true;
            _poll?.cancel();
          }
          if (processed) {
            return _PlantedView(
              amount: widget.amount,
              labelName: widget.labelName,
              treeName: widget.treeName,
              onClose: _close,
            );
          }
          return _PendingView(invoice: widget.invoice, amount: widget.amount);
        },
      ),
    );
  }

  void _close() {
    // Pop payment + order screens → back to the campaign detail.
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
        // Төлөх дүн
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
        // Автоматаар шалгаж байгаа тухай
        AppBanner(
          icon: Icons.eco_rounded,
          text: tr('center.tree_payment_auto_note'),
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
            child: Text(
              tr('common.scan_qr_hint'),
              style: AppText.caption,
              textAlign: TextAlign.center,
            ),
          )
        else
          _BankList(links: invoice.links),
      ],
    );
  }
}

/// Банкны апп-уудын жагсаалт — нэг карт дотор мөр бүрт лого, нэр, chevron.
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
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _fallback(),
        ),
      ),
    );
  }

  Widget _fallback() => const AppIconTile(
        size: 44,
        child: Icon(Icons.account_balance_rounded,
            color: Colors.white24, size: 22),
      );
}

class _PlantedView extends StatelessWidget {
  final int amount;
  final String labelName;
  final String treeName;
  final VoidCallback onClose;

  const _PlantedView({
    required this.amount,
    required this.labelName,
    required this.treeName,
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
                    child: Icon(Icons.park_rounded,
                        color: CustomColors.accent, size: 52),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tr('center.tree_will_be_planted'),
                    textAlign: TextAlign.center,
                    style: AppText.title,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$treeName · ${formatMNT(amount)}',
                    textAlign: TextAlign.center,
                    style: AppText.bodyBold
                        .copyWith(color: CustomColors.accent, fontSize: 15),
                  ),
                  const SizedBox(height: 18),
                  // Plaque preview with the engraved name.
                  AppCard(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 14),
                    radius: 16,
                    child: Column(
                      children: [
                        Icon(Icons.eco_rounded,
                            size: 18, color: CustomColors.accent),
                        const SizedBox(height: 6),
                        Text(
                          labelName,
                          textAlign: TextAlign.center,
                          style: AppText.sectionTitle.copyWith(fontSize: 17),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    tr('center.tree_planted_body'),
                    textAlign: TextAlign.center,
                    style: AppText.body.copyWith(fontSize: 13, height: 1.55),
                  ),
                  const SizedBox(height: 26),
                  SizedBox(
                    width: 220,
                    child: AppPrimaryButton(
                      label: tr('common.ok'),
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
