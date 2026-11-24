import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Мөнгөн эдлэлийн ТӨГРӨГИЙН идэвхтэй хуваан төлөлтийг шинэ (буурсан) үнээр
/// ЛАН руу шилжүүлэх санал.
///
/// Дүрэм: төлсөн хувь хэвээр хадгалагдаж лан болно; үлдсэн ланг тухайн үеийн
/// үнээр лангаар төлнө. Төлсөн дүн, цуцлах эрх хэвээр. Хэрэглэгч өөрөө
/// зөвшөөрч шилжинэ; шилжих боломжгүй хуваан төлөлтөд (хөөрөг, шатар г.м.)
/// энэ виджет юу ч харуулахгүй.
class LanConversionOffer extends StatefulWidget {
  final ProductPurchase purchase;
  const LanConversionOffer({super.key, required this.purchase});

  @override
  State<LanConversionOffer> createState() => _LanConversionOfferState();
}

class _LanConversionOfferState extends State<LanConversionOffer> {
  final ProductRepository _repo = ProductRepository();
  LanConversion? _preview;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await _repo.lanConversion(purchaseId: widget.purchase.id);
      if (mounted) setState(() => _preview = p);
    } catch (_) {
      // Санал харуулах боломжгүй бол чимээгүй — үндсэн дэлгэцэд саад болохгүй.
    }
  }

  Future<void> _onTap(LanConversion c) async {
    if (_busy) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => _ConfirmDialog(c: c),
    );
    if (ok != true || !mounted) return;
    setState(() => _busy = true);
    try {
      final r = await _repo.lanConversion(
        purchaseId: widget.purchase.id,
        accept: true,
        platform: Platform.isIOS ? 'ios' : 'android',
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (d) => AppDialog(
          icon: Icons.check_rounded,
          iconColor: CustomColors.positive,
          title: tr('silver.convert_done_title'),
          message: tr('silver.convert_done_body', {
            'paid': formatGrams(r.paidLan, 'lan'),
            'remaining': formatGrams(r.remainingLan, 'lan'),
          }),
          primaryLabel: tr('purchase.ok'),
          onPrimary: () => Navigator.of(d).pop(),
        ),
      );
      if (mounted) setState(() => _preview = null);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('product.error_with', {'error': e}))),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _preview;
    if (c == null || !c.eligible) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.trending_down_rounded,
                    size: 18, color: CustomColors.positive),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(tr('silver.convert_title'),
                      style: AppText.sectionTitle),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(tr('silver.convert_intro'), style: AppText.caption),
            const SizedBox(height: 8),
            AppInfoRow(
              label: tr('silver.convert_old_remaining'),
              value: formatMNT(c.oldRemainingAmount),
            ),
            AppInfoRow(
              label: tr('silver.convert_new_remaining', {
                'lan': formatGrams(c.remainingLan, 'lan'),
              }),
              value: formatMNT(c.newRemainingAmount),
              valueColor: CustomColors.accent,
            ),
            AppInfoRow(
              label: tr('silver.convert_saving'),
              value: formatMNT(c.savingAmount),
              valueColor: CustomColors.positive,
            ),
            const SizedBox(height: 10),
            AppPrimaryButton(
              label: tr('silver.convert_button'),
              loading: _busy,
              onPressed: _busy ? null : () => _onTap(c),
            ),
          ],
        ),
      ),
    );
  }
}

/// Зөвшөөрлийн цонх: нөхцөлүүдийг тодорхой харуулж, чагтлуулж баталгаажуулна.
class _ConfirmDialog extends StatefulWidget {
  final LanConversion c;
  const _ConfirmDialog({required this.c});

  @override
  State<_ConfirmDialog> createState() => _ConfirmDialogState();
}

class _ConfirmDialogState extends State<_ConfirmDialog> {
  bool _agreed = false;

  @override
  Widget build(BuildContext context) {
    final c = widget.c;
    Widget point(String text) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Icon(Icons.circle, size: 6, color: CustomColors.accent),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(text,
                    style: AppText.body.copyWith(fontSize: 13, height: 1.35)),
              ),
            ],
          ),
        );
    return AlertDialog(
      backgroundColor: CustomColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(tr('silver.convert_confirm_title'),
          style: AppText.sectionTitle.copyWith(fontSize: 17)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            point(tr('silver.convert_point_percent', {
              'percent': c.progressPercent.toStringAsFixed(1),
              'paid': formatGrams(c.paidLan, 'lan'),
              'total': formatGrams(c.totalLan, 'lan'),
            })),
            point(tr('silver.convert_point_remaining', {
              'remaining': formatGrams(c.remainingLan, 'lan'),
              'price': formatMNT(c.pricePerLan),
              'amount': formatMNT(c.newRemainingAmount),
            })),
            point(tr('silver.convert_point_floating')),
            point(tr('silver.convert_point_cancel', {
              'paid': formatMNT(c.paidAmount),
              'percent': c.cancelFeePercent,
            })),
            point(tr('silver.convert_point_final')),
            const SizedBox(height: 4),
            InkWell(
              onTap: () => setState(() => _agreed = !_agreed),
              child: Row(
                children: [
                  Checkbox(
                    value: _agreed,
                    activeColor: CustomColors.accent,
                    checkColor: Colors.black,
                    onChanged: (v) => setState(() => _agreed = v ?? false),
                  ),
                  Expanded(
                    child: Text(tr('silver.convert_agree'),
                        style: AppText.body.copyWith(fontSize: 13)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(tr('common.cancel'),
              style: TextStyle(color: CustomColors.textSecondary)),
        ),
        TextButton(
          onPressed: _agreed ? () => Navigator.of(context).pop(true) : null,
          child: Text(tr('silver.convert_button'),
              style: TextStyle(
                  color:
                      _agreed ? CustomColors.accent : CustomColors.textTertiary,
                  fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
