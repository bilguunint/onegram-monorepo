import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/elements/terms_accept_checkbox.dart';
import 'package:onegrgold/elements/terms_content.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/gold_grams_picker.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Алтан эдлэлийн тооцоолуур: хэрэглэгч өдөрт цуглуулах граммаа сонгоно,
/// систем өнөөдрийн ханшаар төлбөр ба ойролцоо хоногийг харуулна.
/// Баталбал өдрийн граммыг (double) буцаана; цуцалбал null.
class GoldInstallmentSetupSheet extends StatefulWidget {
  final Product product;
  const GoldInstallmentSetupSheet({super.key, required this.product});

  @override
  State<GoldInstallmentSetupSheet> createState() =>
      _GoldInstallmentSetupSheetState();
}

class _GoldInstallmentSetupSheetState extends State<GoldInstallmentSetupSheet> {
  final ProductRepository _repo = ProductRepository();
  GoldQuote? _quote;
  Object? _error;
  double _daily = 0.1;
  bool _termsAccepted = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final q = await _repo.fetchGoldQuote();
      if (!mounted) return;
      setState(() {
        _quote = q;
        _daily = GoldGramsPicker.clampGrams(
            q.minStepGrams, widget.product.totalGrams, q.minStepGrams);
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final q = _quote;
    final days = q == null || _daily <= 0
        ? 0
        : ((p.totalGrams * 100).round() / (_daily * 100).round()).ceil();
    final maxH = MediaQuery.of(context).size.height * 0.85;

    // Агуулга гүйлгэгдэнэ, "Цуцлах/Батлах" товч доор тогтмол харагдана —
    // жижиг дэлгэц дээр ч товч далдлагдахгүй.
    return AppSheet(
      title: tr('gold.start_title'),
      padding: EdgeInsets.fromLTRB(
          20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 16),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxH),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.name,
                        style: AppText.caption,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 10),
                    if (q == null)
                      AppCard(
                        color: CustomColors.surfaceAlt,
                        radius: 16,
                        child: Row(
                          children: [
                            if (_error == null)
                              const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _error == null
                                    ? tr('gold.quote_loading')
                                    : tr('gold.quote_error'),
                                style: AppText.caption,
                              ),
                            ),
                            if (_error != null)
                              TextButton(
                                  onPressed: _load,
                                  child: Text(tr('common.retry'))),
                          ],
                        ),
                      )
                    else ...[
                      AppCard(
                        color: CustomColors.surfaceAlt,
                        radius: 16,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 4),
                        child: Column(
                          children: [
                            AppInfoRow(
                              label: tr('gold.total_grams'),
                              value: formatGrams(p.totalGrams),
                            ),
                            AppInfoRow(
                              label: tr('gold.price_per_gram_short'),
                              value: formatMNT(q.pricePerGram),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        tr('gold.price_formula_hint', {
                          'rate': formatMNT(q.rate),
                          'tax': q.taxPercent == q.taxPercent.roundToDouble()
                              ? q.taxPercent.toInt()
                              : q.taxPercent,
                          'labor': formatMNT(q.laborPerGram),
                        }),
                        style: AppText.caption.copyWith(fontSize: 11),
                      ),
                      const SizedBox(height: 14),
                      Text(tr('gold.daily_grams'), style: AppText.sectionTitle),
                      const SizedBox(height: 8),
                      GoldGramsPicker(
                        value: _daily,
                        max: p.totalGrams,
                        step: q.minStepGrams,
                        showStepper: false,
                        onChanged: (g) => setState(() => _daily = g),
                      ),
                      const SizedBox(height: 10),
                      AppCard(
                        color: CustomColors.surfaceAlt,
                        radius: 16,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 4),
                        child: AppInfoRow(
                          label: tr('gold.today_payment'),
                          value:
                              '${formatMNT(q.amountFor(_daily))} · ~$days ${tr('gold.days_short')}',
                          valueColor: CustomColors.accent,
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    Text(tr('purchase.terms_title'),
                        style: AppText.sectionTitle),
                    const SizedBox(height: 8),
                    Container(
                      constraints: const BoxConstraints(maxHeight: 110),
                      decoration: BoxDecoration(
                        color: CustomColors.surfaceAlt,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: CustomColors.surfaceBorder),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: const Scrollbar(
                        child: SingleChildScrollView(
                          child: TermsContent(
                              termsKey: 'installment', compact: true),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TermsAcceptCheckbox(
                      termsKey: 'installment',
                      value: _termsAccepted,
                      onChanged: (v) => setState(() => _termsAccepted = v),
                      label: tr('purchase.terms_accept'),
                      labelStyle: AppText.body.copyWith(fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AppPrimaryButton(
                    label: tr('common.cancel'),
                    outlined: true,
                    onPressed: () => Navigator.of(context).pop(null),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AppPrimaryButton(
                    label: tr('common.confirm'),
                    onPressed: _termsAccepted && q != null
                        ? () => Navigator.of(context).pop(_daily)
                        : null,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
