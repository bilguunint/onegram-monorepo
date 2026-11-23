import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/gold_grams_picker.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Дараагийн төлбөрт хэдэн грамм авахаа сонгох sheet. Баталбал граммыг
/// (double) буцаана; цуцалбал null.
class GoldGramsSelectSheet extends StatefulWidget {
  final double remainingGrams;
  final double dailyGrams;

  /// Нэгж: 'gr' (алт) | 'lan' (мөнгө).
  final String unit;
  const GoldGramsSelectSheet({
    super.key,
    required this.remainingGrams,
    required this.dailyGrams,
    this.unit = 'gr',
  });

  @override
  State<GoldGramsSelectSheet> createState() => _GoldGramsSelectSheetState();
}

class _GoldGramsSelectSheetState extends State<GoldGramsSelectSheet> {
  final ProductRepository _repo = ProductRepository();
  GoldQuote? _quote;
  Object? _error;
  double _grams = 0.1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final q = await _repo.fetchGoldQuote(
        kind: widget.unit == 'lan' ? 'silver_jewelry' : 'gold_jewelry',
      );
      if (!mounted) return;
      setState(() {
        _quote = q;
        _grams = GoldGramsPicker.clampGrams(
          widget.dailyGrams > 0 ? widget.dailyGrams : q.minStepGrams,
          widget.remainingGrams,
          q.minStepGrams,
        );
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _quote;
    return AppSheet(
      title: wtr(widget.unit, 'gold.pay_grams_title'),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            wtr(widget.unit, 'gold.remaining_grams', {
              'grams': formatGrams(widget.remainingGrams, widget.unit),
            }),
            style: AppText.caption,
          ),
          const SizedBox(height: 14),
          if (q == null)
            Row(
              children: [
                if (_error == null)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _error == null
                        ? wtr(widget.unit, 'gold.quote_loading')
                        : wtr(widget.unit, 'gold.quote_error'),
                    style: AppText.caption,
                  ),
                ),
                if (_error != null)
                  TextButton(onPressed: _load, child: Text(tr('common.retry'))),
              ],
            )
          else ...[
            GoldGramsPicker(
              value: _grams,
              max: widget.remainingGrams,
              step: q.minStepGrams,
              showAll: true,
              unit: widget.unit,
              onChanged: (g) => setState(() => _grams = g),
            ),
            const SizedBox(height: 14),
            AppCard(
              color: CustomColors.surfaceAlt,
              radius: 16,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: Column(
                children: [
                  AppInfoRow(
                    label: wtr(widget.unit, 'gold.today_rate'),
                    value: formatMNT(q.rate),
                  ),
                  AppInfoRow(
                    label: wtr(widget.unit, 'gold.today_payment'),
                    value: formatMNT(q.amountFor(_grams)),
                    valueColor: CustomColors.accent,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            AppPrimaryButton(
              label: tr('purchase.pay'),
              onPressed: () => Navigator.of(context).pop(_grams),
            ),
          ],
        ],
      ),
    );
  }
}
