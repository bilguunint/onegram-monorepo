import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Гэрчилгээ шалгах: камераар QR уншаад серверээр гарын үсгийг баталгаажуулна.
/// Нэвтрэлт шаардахгүй тул дэлгүүрийн ажилтан ч өөрийн аппаараа шалгаж болно.
class ShuteenVerifyScreen extends StatefulWidget {
  const ShuteenVerifyScreen({super.key});

  @override
  State<ShuteenVerifyScreen> createState() => _ShuteenVerifyScreenState();
}

class _ShuteenVerifyScreenState extends State<ShuteenVerifyScreen> {
  final ShuteenRepository _repo = ShuteenRepository();
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );

  bool _busy = false;
  ShuteenVerifyResult? _result;
  String? _localError;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy || _result != null || _localError != null) return;
    final raw = capture.barcodes
        .map((b) => b.rawValue)
        .firstWhere((v) => v != null && v.isNotEmpty, orElse: () => null);
    if (raw == null) return;

    HapticFeedback.mediumImpact();
    if (!raw.startsWith('shuteen:')) {
      setState(() => _localError = tr('shuteen.verify_not_shuteen'));
      await _controller.stop();
      return;
    }

    setState(() => _busy = true);
    await _controller.stop();
    try {
      final r = await _repo.verifyCertificate(raw);
      if (!mounted) return;
      setState(() => _result = r);
      HapticFeedback.heavyImpact();
    } catch (_) {
      if (!mounted) return;
      setState(() => _localError = tr('shuteen.verify_reason_error'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reset() async {
    setState(() {
      _result = null;
      _localError = null;
    });
    await _controller.start();
  }

  @override
  Widget build(BuildContext context) {
    final r = _result;
    final err = _localError;
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(
        tr('shuteen.verify_title'),
        actions: [
          IconButton(
            tooltip: 'Flash',
            icon: const Icon(Icons.flashlight_on_outlined, color: Colors.white),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Column(
        children: [
          // ---- Камер ----
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: AspectRatio(
                aspectRatio: 1,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MobileScanner(
                      controller: _controller,
                      onDetect: _onDetect,
                      errorBuilder: (context, error) => _CameraError(
                        message: tr('shuteen.camera_denied'),
                      ),
                    ),
                    // Хүрээ
                    IgnorePointer(
                      child: Center(
                        child: Container(
                          width: 220,
                          height: 220,
                          decoration: BoxDecoration(
                            border: Border.all(
                                color: r == null && err == null
                                    ? CustomColors.accent
                                    : (r?.valid ?? false)
                                        ? CustomColors.positive
                                        : CustomColors.negative,
                                width: 2),
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                      ),
                    ),
                    if (_busy)
                      Container(
                        color: Colors.black45,
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(
                                color: CustomColors.accent, strokeWidth: 2),
                            const SizedBox(height: 10),
                            Text(tr('shuteen.verify_checking'),
                                style: AppText.bodyBold),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          // ---- Үр дүн / заавар ----
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                if (r == null && err == null)
                  AppBanner(
                    icon: Icons.qr_code_scanner_rounded,
                    text: tr('shuteen.verify_hint'),
                  )
                else if (err != null)
                  _ResultCard(valid: false, title: tr('shuteen.verify_invalid'), body: err)
                else
                  _VerifiedCard(result: r!),
                if (r != null || err != null) ...[
                  const SizedBox(height: 16),
                  AppPrimaryButton(
                    label: tr('shuteen.verify_scan_again'),
                    icon: Icons.qr_code_scanner_rounded,
                    outlined: true,
                    onPressed: _reset,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CameraError extends StatelessWidget {
  const _CameraError({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: CustomColors.surfaceAlt,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.no_photography_outlined,
              size: 40, color: CustomColors.textSecondary),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center, style: AppText.caption),
        ],
      ),
    );
  }
}

/// Хүчинтэй / хүчингүй гэсэн ерөнхий үр дүнгийн карт
class _ResultCard extends StatelessWidget {
  const _ResultCard(
      {required this.valid, required this.title, required this.body, this.child});
  final bool valid;
  final String title;
  final String body;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final Color c = valid ? CustomColors.positive : CustomColors.negative;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.withOpacity(0.10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withOpacity(0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppIconTile(
                size: 44,
                color: c.withOpacity(0.18),
                child: Icon(
                    valid ? Icons.verified_rounded : Icons.cancel_rounded,
                    color: c,
                    size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: AppText.sectionTitle.copyWith(color: c)),
                    const SizedBox(height: 2),
                    Text(body, style: AppText.caption.copyWith(height: 1.4)),
                  ],
                ),
              ),
            ],
          ),
          if (child != null) ...[
            const SizedBox(height: 14),
            child!,
          ],
        ],
      ),
    );
  }
}

class _VerifiedCard extends StatelessWidget {
  const _VerifiedCard({required this.result});
  final ShuteenVerifyResult result;

  String _reasonText() {
    final r = result;
    if (r.valid) return r.certificateNo;
    if (r.reason == 'invalid_signature') {
      return tr('shuteen.verify_reason_invalid_signature');
    }
    if (r.reason == 'not_found' || r.reason == 'mismatch') {
      return tr('shuteen.verify_reason_not_found');
    }
    if (r.reason.startsWith('status_')) {
      return tr('shuteen.verify_reason_status', {'status': _statusLabel(r.status)});
    }
    return tr('shuteen.verify_reason_error');
  }

  @override
  Widget build(BuildContext context) {
    final r = result;
    final bool hasDetails = r.certificateNo.isNotEmpty;
    return _ResultCard(
      valid: r.valid,
      title: r.valid ? tr('shuteen.verify_valid') : tr('shuteen.verify_invalid'),
      body: _reasonText(),
      child: hasDetails
          ? Column(
              children: [
                AppInfoRow(
                    label: tr('shuteen.certificate_no'),
                    value: r.certificateNo,
                    dense: true),
                AppInfoRow(
                    label: tr('shuteen.owner'),
                    value: r.ownerInitials.isEmpty ? '—' : r.ownerInitials,
                    dense: true),
                AppInfoRow(
                    label: tr('shuteen.my_units'),
                    value: tr('shuteen.units_value', {'n': _fmt(r.units)}),
                    dense: true),
                if (r.tier > 0)
                  AppInfoRow(
                      label: tr('shuteen.calc_tier'),
                      value: tr('shuteen.tier_n', {'n': _roman(r.tier)}),
                      valueColor: CustomColors.accent,
                      dense: true),
                AppInfoRow(
                    label: tr('shuteen.verify_issued'),
                    value: _fmtDate(r.issuedAt),
                    dense: true),
                AppInfoRow(
                    label: tr('shuteen.buyback_at'),
                    value: _fmtDate(r.buybackAt),
                    dense: true),
                AppInfoRow(
                    label: tr('shuteen.verify_status'),
                    value: _statusLabel(r.status),
                    valueColor: r.valid
                        ? CustomColors.positive
                        : CustomColors.negative,
                    dense: true),
              ],
            )
          : null,
    );
  }
}

String _statusLabel(String s) {
  switch (s) {
    case 'active':
      return tr('shuteen.status_active');
    case 'bought_back':
      return tr('shuteen.status_bought_back');
    case 'cancelled':
      return tr('shuteen.status_cancelled');
    default:
      return s;
  }
}

String _fmt(num n) => formatMNT(n).replaceAll('₮', '');
String _roman(int n) => const ['', 'I', 'II', 'III'][n.clamp(0, 3)];
String _fmtDate(DateTime? d) => d == null
    ? '—'
    : '${d.year}.${d.month.toString().padLeft(2, '0')}.${d.day.toString().padLeft(2, '0')}';
