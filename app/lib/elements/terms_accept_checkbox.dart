import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/elements/signature_pad.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/terms_model.dart';
import 'package:onegrgold/repositories/terms_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// "Үйлчилгээний нөхцөлийг хүлээн зөвшөөрч байна" checkbox.
///
/// Анх удаа (эсвэл нөхцөл шинэчлэгдсэний дараа) чагтлахад гарын үсгийн самбар
/// нээгдэж, гарын үсгийг `terms_acceptances`-д тухайн хувилбартай нь
/// хадгална. Тухайн хувилбарыг аль хэдийн зурсан бол зөвхөн чагтлаад
/// үргэлжлүүлнэ. Нөхцөл шинэчлэгдсэн бол шинэчлэгдсэн огноог харуулж дахин
/// гарын үсэг шаардана.
///
/// Нөхцөл Firestore-оос ирээгүй (офлайн нөөц) эсвэл хэрэглэгч нэвтрээгүй бол
/// энгийн checkbox шиг ажиллана.
class TermsAcceptCheckbox extends StatefulWidget {
  final String termsKey;
  final bool value;
  final ValueChanged<bool> onChanged;
  final String label;
  /// Шошгоны текстийн хэв маяг (дэлгэц бүр өөр хэмжээтэй).
  final TextStyle? labelStyle;

  const TermsAcceptCheckbox({
    super.key,
    required this.termsKey,
    required this.value,
    required this.onChanged,
    required this.label,
    this.labelStyle,
  });

  @override
  State<TermsAcceptCheckbox> createState() => _TermsAcceptCheckboxState();
}

class _TermsAcceptCheckboxState extends State<TermsAcceptCheckbox> {
  final _repo = TermsRepository.instance;
  TermsDoc? _doc;
  TermsAcceptance? _current; // одоогийн хувилбарт зурсан
  TermsAcceptance? _latest; // аль ч хувилбарт зурсан хамгийн сүүлийнх
  bool _busy = false;

  bool get _signedIn => FirebaseAuth.instance.currentUser != null;

  /// Гарын үсэг шаардах эсэх.
  bool get _needsSignature =>
      _signedIn && _doc != null && _doc!.fromServer && _current == null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final doc = await _repo.load(widget.termsKey);
    TermsAcceptance? current;
    TermsAcceptance? latest;
    if (_signedIn && doc.fromServer) {
      current = await _repo.acceptance(widget.termsKey, doc.version);
      latest = current ?? await _repo.latestAcceptance(widget.termsKey);
    }
    if (!mounted) return;
    setState(() {
      _doc = doc;
      _current = current;
      _latest = latest;
    });
  }

  Future<void> _toggle() async {
    if (_busy) return;
    if (widget.value) {
      widget.onChanged(false);
      return;
    }
    if (!_needsSignature) {
      widget.onChanged(true);
      return;
    }
    final doc = _doc!;
    final result = await showSignatureSheet(context, doc);
    if (result == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final a = await _repo.recordAcceptance(
        doc: doc,
        signaturePng: result.png,
        width: result.width,
        height: result.height,
      );
      if (!mounted) return;
      setState(() {
        _current = a;
        _latest = a;
      });
      widget.onChanged(true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('terms.sign_saved'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('terms.sign_failed'))),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  static String _fmtDate(DateTime? d) {
    if (d == null) return '';
    final l = d.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${l.year}.${two(l.month)}.${two(l.day)}';
  }

  Widget? _statusLine() {
    final doc = _doc;
    if (doc == null || !doc.fromServer || !_signedIn) return null;
    final small = AppText.caption.copyWith(fontSize: 11, height: 1.35);
    if (_current != null) {
      return Text(
        tr('terms.status_signed', {
          'date': _fmtDate(_current!.acceptedAt),
          'version': doc.version,
        }),
        style: small.copyWith(color: CustomColors.textSecondary),
      );
    }
    if (_latest != null && _latest!.version < doc.version) {
      return Text(
        tr('terms.status_updated', {
          'date': _fmtDate(doc.updatedAt),
          'version': doc.version,
        }),
        style: small.copyWith(color: CustomColors.accent),
      );
    }
    return Text(
      tr('terms.status_sign_required'),
      style: small.copyWith(color: CustomColors.textTertiary),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = _statusLine();
    return InkWell(
      onTap: _toggle,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: _busy
                  ? const Padding(
                      padding: EdgeInsets.all(3),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Checkbox(
                      activeColor: CustomColors.accent,
                      checkColor: Colors.black,
                      side: BorderSide(
                          color: CustomColors.textTertiary, width: 1.5),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0)),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                      value: widget.value,
                      onChanged: (_) => _toggle(),
                    ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(
                      widget.label,
                      style: widget.labelStyle ??
                          AppText.caption.copyWith(color: Colors.white),
                    ),
                  ),
                  if (status != null) ...[
                    const SizedBox(height: 3),
                    status,
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Гарын үсгийн самбарын үр дүн.
class SignatureResult {
  final Uint8List png;
  final int width;
  final int height;
  const SignatureResult(this.png, this.width, this.height);
}

/// Доороос гарч ирэх гарын үсгийн самбар. Хадгалвал PNG, цуцалбал null.
Future<SignatureResult?> showSignatureSheet(
    BuildContext context, TermsDoc doc) {
  return showModalBottomSheet<SignatureResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _SignatureSheet(doc: doc),
  );
}

class _SignatureSheet extends StatefulWidget {
  final TermsDoc doc;
  const _SignatureSheet({required this.doc});

  @override
  State<_SignatureSheet> createState() => _SignatureSheetState();
}

class _SignatureSheetState extends State<_SignatureSheet> {
  final _controller = SignatureController();
  bool _saving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_controller.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('terms.sign_empty'))),
      );
      return;
    }
    setState(() => _saving = true);
    final png = await _controller.toPng();
    final size = _controller.size;
    if (!mounted) return;
    Navigator.of(context).pop(SignatureResult(
      png,
      (size.width * 2).round(),
      (size.height * 2).round(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLocale.current.code;
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        decoration: BoxDecoration(
          color: CustomColors.appBackground,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: CustomColors.surfaceBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(tr('terms.sign_title'), style: AppText.sectionTitle),
              const SizedBox(height: 4),
              Text(
                tr('terms.sign_agree_note', {
                  'title': widget.doc.titleFor(lang),
                  'version': widget.doc.version,
                }),
                style: AppText.caption.copyWith(height: 1.4),
              ),
              const SizedBox(height: 12),
              AnimatedBuilder(
                animation: _controller,
                builder: (context, _) => Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SizedBox(
                        height: 220,
                        width: double.infinity,
                        child: SignaturePad(controller: _controller),
                      ),
                    ),
                    if (_controller.isEmpty)
                      Positioned.fill(
                        child: IgnorePointer(
                          child: Center(
                            child: Text(
                              tr('terms.sign_hint'),
                              textAlign: TextAlign.center,
                              style: AppText.caption
                                  .copyWith(color: Colors.black38),
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 36,
                      child: IgnorePointer(
                        child: Container(height: 1, color: Colors.black26),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _saving ? null : _controller.clear,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: BorderSide(color: CustomColors.surfaceBorder),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text(tr('terms.sign_clear')),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppPrimaryButton(
                      label: tr('terms.sign_save'),
                      loading: _saving,
                      onPressed: _saving ? null : _save,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
