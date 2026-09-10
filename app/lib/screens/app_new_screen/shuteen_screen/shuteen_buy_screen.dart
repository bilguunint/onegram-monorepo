import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_payment_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Нэгж сонгох дэлгэц: тоо оруулах, хурдан сонголт, амьд тооцоолол,
/// нөхцөл зөвшөөрөх, дараа нь QPay төлбөр.
class ShuteenBuyScreen extends StatefulWidget {
  const ShuteenBuyScreen({super.key, required this.program});
  final ShuteenProgramInfo program;

  @override
  State<ShuteenBuyScreen> createState() => _ShuteenBuyScreenState();
}

class _ShuteenBuyScreenState extends State<ShuteenBuyScreen> {
  static const List<int> _quick = [1, 10, 100, 500, 1000, 10000];
  static const int _maxUnits = 100000;

  final ShuteenRepository _repo = ShuteenRepository();
  final TextEditingController _ctrl = TextEditingController(text: '1');
  int _units = 1;
  bool _agreed = false;
  bool _busy = false;

  ShuteenProgramInfo get p => widget.program;

  int get _remaining =>
      p.totalUnits > 0 ? (p.totalUnits - p.soldUnits).clamp(0, p.totalUnits) : _maxUnits;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _setUnits(int v) {
    final int clamped = v.clamp(1, _maxUnits);
    setState(() {
      _units = clamped;
      final txt = '$clamped';
      if (_ctrl.text != txt) {
        _ctrl.value = TextEditingValue(
          text: txt,
          selection: TextSelection.collapsed(offset: txt.length),
        );
      }
    });
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (_units > _remaining) {
      _snack(tr('shuteen.remaining_units',
          {'sold': _fmt(p.soldUnits), 'total': _fmt(p.totalUnits)}));
      return;
    }
    setState(() => _busy = true);
    try {
      final checkout = await _repo.createOrder(units: _units);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ShuteenPaymentScreen(
            pendingId: checkout.pendingId,
            amount: checkout.amount,
            units: checkout.units,
            invoice: checkout.invoice,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: CustomColors.negative,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final int pay = p.unitPrice * _units;
    final int after = p.buybackPrice * _units;
    final int gain = after - pay;
    final int tier = ShuteenProgramInfo.tierFor(_units);
    final bool soldOut = _remaining <= 0;
    final bool tooMany = _units > _remaining;

    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('shuteen.buy_title')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          // ---- Нэгжийн тоо ----
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('shuteen.units_label'), style: AppText.caption),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _StepBtn(
                      icon: Icons.remove_rounded,
                      onTap: _units > 1 ? () => _setUnits(_units - 1) : null,
                    ),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        style: AppText.display.copyWith(fontSize: 34),
                        cursorColor: CustomColors.accent,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onChanged: (v) {
                          final n = int.tryParse(v) ?? 0;
                          if (n >= 1) {
                            setState(() => _units = n.clamp(1, _maxUnits));
                          }
                        },
                      ),
                    ),
                    _StepBtn(
                      icon: Icons.add_rounded,
                      onTap: _units < _maxUnits
                          ? () => _setUnits(_units + 1)
                          : null,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Center(
                  child: Text(
                    '${formatMNT(p.unitPrice)} × ${_fmt(_units)}',
                    style: AppText.caption,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final q in _quick)
                      _Pill(
                        label: _fmt(q),
                        selected: _units == q,
                        onTap: () => _setUnits(q),
                      ),
                  ],
                ),
                if (p.totalUnits > 0) ...[
                  const SizedBox(height: 14),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (p.soldUnits / p.totalUnits).clamp(0.0, 1.0),
                      minHeight: 6,
                      backgroundColor: Colors.white.withOpacity(0.08),
                      valueColor:
                          AlwaysStoppedAnimation(CustomColors.accent),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tr('shuteen.remaining_units', {
                      'sold': _fmt(p.soldUnits),
                      'total': _fmt(p.totalUnits),
                    }),
                    style: AppText.caption.copyWith(fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ---- Тооцоолол ----
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('shuteen.calc_title'), style: AppText.sectionTitle),
                const SizedBox(height: 6),
                AppInfoRow(label: tr('shuteen.calc_pay'), value: formatMNT(pay)),
                const AppDivider(),
                AppInfoRow(
                  label: tr('shuteen.calc_after', {'months': p.holdMonths}),
                  value: formatMNT(after),
                  valueColor: CustomColors.accent,
                ),
                const AppDivider(),
                AppInfoRow(
                  label: tr('shuteen.calc_gain'),
                  value: '+${formatMNT(gain)}',
                  valueColor: CustomColors.positive,
                ),
                const AppDivider(),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(tr('shuteen.calc_tier'),
                            style: AppText.caption.copyWith(fontSize: 13)),
                      ),
                      tier == 0
                          ? Flexible(
                              child: Text(tr('shuteen.tier_none'),
                                  textAlign: TextAlign.right,
                                  style: AppText.caption.copyWith(
                                      fontSize: 12,
                                      color: CustomColors.textTertiary)),
                            )
                          : AppStatusChip(
                              icon: Icons.workspace_premium_rounded,
                              label: tr('shuteen.tier_n', {'n': _roman(tier)}),
                            ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(tr('shuteen.tax_note'),
                    style: AppText.caption.copyWith(
                        fontSize: 10.5, color: CustomColors.textTertiary)),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (soldOut)
            AppBanner(
              color: CustomColors.negative,
              icon: Icons.block_rounded,
              text: tr('shuteen.remaining_units',
                  {'sold': _fmt(p.soldUnits), 'total': _fmt(p.totalUnits)}),
            )
          else if (tooMany)
            AppBanner(
              color: CustomColors.negative,
              icon: Icons.warning_amber_rounded,
              text: tr('shuteen.remaining_units',
                  {'sold': _fmt(p.soldUnits), 'total': _fmt(p.totalUnits)}),
            ),

          // ---- Нөхцөл ----
          const SizedBox(height: 4),
          InkWell(
            onTap: () => setState(() => _agreed = !_agreed),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _agreed,
                    onChanged: (v) => setState(() => _agreed = v ?? false),
                    activeColor: CustomColors.accent,
                    checkColor: Colors.black,
                    side: BorderSide(color: CustomColors.textSecondary),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        tr('shuteen.agree_terms', {
                          'months': p.holdMonths,
                          'buyback': _fmt(p.buybackPrice),
                        }),
                        style: AppText.caption.copyWith(height: 1.45),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: AppPrimaryButton(
            label: '${tr('shuteen.continue_pay')} · ${formatMNT(pay)}',
            icon: Icons.qr_code_2_rounded,
            loading: _busy,
            onPressed: _agreed && !soldOut && !tooMany ? _submit : null,
          ),
        ),
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  const _StepBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: onTap == null ? 0.35 : 1,
      child: Material(
        color: CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: SizedBox(
            width: 48,
            height: 48,
            child: Icon(icon, color: CustomColors.accent, size: 24),
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? CustomColors.accent : CustomColors.surfaceAlt,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
          child: Text(
            label,
            style: AppText.bodyBold.copyWith(
              fontSize: 13,
              color: selected ? Colors.black : Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}

String _fmt(num n) => formatMNT(n).replaceAll('₮', '');
String _roman(int n) => const ['', 'I', 'II', 'III'][n.clamp(0, 3)];
