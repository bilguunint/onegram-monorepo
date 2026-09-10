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
import 'package:onegrgold/screens/app_new_screen/center_screen/center_cart.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
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
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
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
        return Scaffold(
          backgroundColor: CustomColors.appBackground,
          appBar: appBar(tr('center.support_payment_title')),
          body: processed
              ? _PaidView(amount: widget.amount, onClose: _close)
              : _PendingView(invoice: widget.invoice, amount: widget.amount),
          bottomNavigationBar: processed
              ? null
              : SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: AppPrimaryButton(
                      label: tr('center.check_payment'),
                      loading: _checking,
                      onPressed: _checking ? null : () => _verify(),
                    ),
                  ),
                ),
        );
      },
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
          text: tr('center.payment_auto_refresh_note'),
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
                      color: CustomColors.accentSoft,
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: CustomColors.accent.withOpacity(0.4)),
                    ),
                    child: Icon(Icons.favorite_rounded,
                        color: CustomColors.accent, size: 52),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tr('center.thank_you'),
                    textAlign: TextAlign.center,
                    style: AppText.title,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tr('center.support_amount', {'amount': formatMNT(amount)}),
                    style: AppText.bodyBold
                        .copyWith(color: CustomColors.accent, fontSize: 15),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    tr('center.thanks_body_1'),
                    textAlign: TextAlign.center,
                    style: AppText.body
                        .copyWith(fontSize: 13, height: 1.55),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    tr('center.thanks_body_2'),
                    textAlign: TextAlign.center,
                    style: AppText.caption.copyWith(height: 1.55),
                  ),
                  const SizedBox(height: 28),
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
