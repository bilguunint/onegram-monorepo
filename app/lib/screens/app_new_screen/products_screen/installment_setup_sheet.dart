import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Bottom sheet that lets the user pick how many months to split the payment
/// over (between [Product.minMonths] and [Product.maxMonths]).
///
/// Returns the chosen month count on confirm, or null on cancel.
class InstallmentSetupSheet extends StatefulWidget {
  final Product product;

  const InstallmentSetupSheet({super.key, required this.product});

  @override
  State<InstallmentSetupSheet> createState() => _InstallmentSetupSheetState();
}

class _InstallmentSetupSheetState extends State<InstallmentSetupSheet> {
  late int _months;
  bool _termsAccepted = false;

  @override
  void initState() {
    super.initState();
    _months = widget.product.maxMonths.clamp(1, 12);
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final minM = p.minMonths.clamp(1, 12);
    final maxM = p.maxMonths.clamp(1, 12);
    final totalDays = totalDaysFor(_months);
    final daily = dailyAmount(p.price, _months);

    return AppSheet(
      title: tr('purchase.installment_plan_title'),
      padding: EdgeInsets.fromLTRB(
        20,
        8,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            p.name,
            style: AppText.caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),

          // Summary
          AppCard(
            color: CustomColors.surfaceAlt,
            radius: 16,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: Column(
              children: [
                AppInfoRow(
                  label: tr('purchase.total_price'),
                  value: formatMNT(p.price),
                ),
                AppInfoRow(
                  label: tr('purchase.selected_term'),
                  value: tr('purchase.months_days',
                      {'months': _months, 'days': totalDays}),
                ),
                const AppDivider(),
                AppInfoRow(
                  label: tr('purchase.daily'),
                  value: formatMNT(daily),
                  valueColor: CustomColors.accent,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          Text(tr('purchase.select_months'), style: AppText.sectionTitle),
          const SizedBox(height: 10),
          _MonthChips(
            min: minM,
            max: maxM,
            selected: _months,
            onChanged: (m) => setState(() => _months = m),
          ),

          const SizedBox(height: 16),

          // Terms of service
          Text(tr('purchase.terms_title'), style: AppText.sectionTitle),
          const SizedBox(height: 10),
          Container(
            constraints: const BoxConstraints(maxHeight: 160),
            decoration: BoxDecoration(
              color: CustomColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CustomColors.surfaceBorder),
            ),
            padding: const EdgeInsets.all(12),
            child: Scrollbar(
              child: SingleChildScrollView(
                child: Text(
                  tr('purchase.terms_text'),
                  style: AppText.caption
                      .copyWith(color: Colors.white.withOpacity(0.78)),
                ),
              ),
            ),
          ),

          const SizedBox(height: 10),
          // Acceptance checkbox
          InkWell(
            onTap: () => setState(() => _termsAccepted = !_termsAccepted),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: _termsAccepted
                          ? CustomColors.accent
                          : Colors.transparent,
                      border: Border.all(
                        color: _termsAccepted
                            ? CustomColors.accent
                            : CustomColors.textTertiary,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: _termsAccepted
                        ? const Icon(
                            Icons.check_rounded,
                            size: 15,
                            color: Colors.black,
                          )
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      tr('purchase.terms_accept'),
                      style: AppText.body.copyWith(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),
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
                  onPressed: _termsAccepted
                      ? () => Navigator.of(context).pop(_months)
                      : null,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Сарын сонголтын pill-үүд: сонгосон = алтан дэвсгэр хар текст,
/// бусад = surfaceAlt дээр цагаан текст
class _MonthChips extends StatelessWidget {
  final int min;
  final int max;
  final int selected;
  final ValueChanged<int> onChanged;

  const _MonthChips({
    required this.min,
    required this.max,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final options = [for (var i = min; i <= max; i++) i];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((m) {
        final active = m == selected;
        return GestureDetector(
          onTap: () => onChanged(m),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: active ? CustomColors.accent : CustomColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              tr('purchase.n_months', {'n': m}),
              style: TextStyle(
                fontFamily: active ? AppText.bold : AppText.medium,
                fontSize: 12.5,
                fontWeight: active ? FontWeight.bold : FontWeight.w500,
                color: active ? Colors.black : Colors.white,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
