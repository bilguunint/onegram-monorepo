import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lottie/lottie.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

/// QPay invoice viewer for a donation purchase. Subscribes to
/// `pending_invoices/{pendingId}`; when the callback sets `status ==
/// "processed"` it clears the cart, shows success and pops back to the
/// campaign detail screen.
class CenterPaymentScreen extends StatefulWidget {
  final String pendingId;
  final int amount;
  final MakeOrder invoice;

  const CenterPaymentScreen({
    super.key,
    required this.pendingId,
    required this.amount,
    required this.invoice,
  });

  @override
  State<CenterPaymentScreen> createState() => _CenterPaymentScreenState();
}

class _CenterPaymentScreenState extends State<CenterPaymentScreen> {
  static const _callbackUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/centerDonationCallback';

  bool _done = false;
  bool _checking = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    // QPay's callback is best-effort; actively re-verify every few seconds so a
    // dropped callback still confirms the payment while the user waits here.
    _poll = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _verify(silent: true),
    );
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  /// Pings the (idempotent) callback, which re-checks QPay and, if PAID,
  /// records the donation + flips pending_invoices to "processed".
  Future<void> _verify({bool silent = false}) async {
    if (_done) return;
    if (!silent && mounted) setState(() => _checking = true);
    try {
      await http
          .get(Uri.parse('$_callbackUrl?pending_id=${widget.pendingId}'))
          .timeout(const Duration(seconds: 20));
    } catch (_) {}
    if (!silent && mounted) setState(() => _checking = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          tr('center.support_payment_title'),
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
            .collection('pending_invoices')
            .doc(widget.pendingId)
            .snapshots(),
        builder: (context, snapshot) {
          final processed = snapshot.data?.data()?['status'] == 'processed';
          if (processed && !_done) {
            _done = true;
            _poll?.cancel();
            WidgetsBinding.instance.addPostFrameCallback((_) {
              CenterCart.instance.clear();
            });
          }
          if (processed) {
            return _PaidView(amount: widget.amount, onClose: _close);
          }
          return _PendingView(
            invoice: widget.invoice,
            amount: widget.amount,
            checking: _checking,
            onCheck: () => _verify(),
          );
        },
      ),
    );
  }

  void _close() {
    // Pop payment + cart screens → back to the campaign detail.
    Navigator.of(context).pop();
    if (mounted && Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }
}

class _PendingView extends StatelessWidget {
  final MakeOrder invoice;
  final int amount;
  final bool checking;
  final VoidCallback onCheck;
  const _PendingView({
    required this.invoice,
    required this.amount,
    required this.checking,
    required this.onCheck,
  });

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
            border: Border.all(color: Colors.white.withOpacity(0.08)),
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
                style: TextStyle(
                  color: CustomColors.mainColor,
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
                  tr('center.payment_auto_refresh_note'),
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        OutlinedButton(
          onPressed: checking ? null : onCheck,
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: CustomColors.mainColor.withOpacity(0.5)),
            padding: const EdgeInsets.symmetric(vertical: 13),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: checking
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : Text(tr('center.check_payment'),
                  style: TextStyle(
                      color: CustomColors.mainColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13)),
        ),
      ],
    );
  }
}

class _PaidView extends StatelessWidget {
  final int amount;
  final VoidCallback onClose;
  const _PaidView({required this.amount, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Celebration confetti behind the message.
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
                      color: CustomColors.mainColor.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: CustomColors.mainColor.withOpacity(0.4)),
                    ),
                    child: Icon(Icons.favorite_rounded,
                        color: CustomColors.mainColor, size: 52),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tr('center.thank_you'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontFamily: 'InterBold',
                      fontWeight: FontWeight.w800,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tr('center.support_amount', {'amount': formatMNT(amount)}),
                    style: TextStyle(
                      color: CustomColors.mainColor,
                      fontFamily: 'RubikBold',
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tr('center.thanks_body_1'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white70, fontSize: 13, height: 1.55),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    tr('center.thanks_body_2'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white60, fontSize: 12.5, height: 1.55),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: 200,
                    child: MainButton(
                      isLoading: false,
                      onPress: onClose,
                      title: Text(
                        tr('common.ok'),
                        style: const TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 14),
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
