import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lottie/lottie.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_order_screen.dart'
    show kForestGreen, kLeafGreen;
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          tr('center.tree_payment_title'),
          style: const TextStyle(
              fontFamily: 'InterBold', fontSize: 13, color: Colors.white),
        ),
        centerTitle: false,
      ),
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
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1F1F22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kForestGreen.withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr('common.amount_due'),
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.55), fontSize: 11)),
              const SizedBox(height: 4),
              Text(
                formatMNT(amount),
                style: const TextStyle(
                  color: kLeafGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 26,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (qr != null)
          Center(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Image.memory(qr,
                  width: 220, height: 220, fit: BoxFit.contain),
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
                onTap: () => launchUrl(Uri.parse(link.deeplink)),
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
            color: kForestGreen.withOpacity(0.10),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kForestGreen.withOpacity(0.35)),
          ),
          child: Row(
            children: [
              const Icon(Icons.eco_rounded, size: 14, color: kLeafGreen),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  tr('center.tree_payment_auto_note'),
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
                      color: kForestGreen.withOpacity(0.20),
                      shape: BoxShape.circle,
                      border: Border.all(color: kLeafGreen.withOpacity(0.5)),
                    ),
                    child: const Icon(Icons.park_rounded,
                        color: kLeafGreen, size: 52),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tr('center.tree_will_be_planted'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontFamily: 'InterBold',
                      fontWeight: FontWeight.w800,
                      fontSize: 21,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$treeName · ${formatMNT(amount)}',
                    style: const TextStyle(
                      color: kLeafGreen,
                      fontFamily: 'RubikBold',
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 18),
                  // Plaque preview with the engraved name.
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 14),
                    decoration: BoxDecoration(
                      color: kForestGreen.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kLeafGreen.withOpacity(0.5)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.eco_rounded,
                            size: 18, color: kLeafGreen),
                        const SizedBox(height: 6),
                        Text(
                          labelName,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'RubikBold',
                            fontSize: 17,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    tr('center.tree_planted_body'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white70, fontSize: 12.5, height: 1.55),
                  ),
                  const SizedBox(height: 26),
                  SizedBox(
                    width: 200,
                    child: GestureDetector(
                      onTap: onClose,
                      child: Container(
                        height: 44,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [kForestGreen, kLeafGreen],
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          tr('common.ok'),
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14),
                        ),
                      ),
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
