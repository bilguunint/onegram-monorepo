import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Bottom sheet that lets the user pick how many upcoming installment days to
/// pay in a single QPay invoice. Days are sequential, so the user selects a
/// contiguous range starting from the next unpaid day ([nextDay]) up to a
/// chosen day. Returns the selected day COUNT on confirm, or null on cancel.
class InstallmentDaySelectSheet extends StatefulWidget {
  final int nextDay;
  final int totalDays;
  final int dailyPayment;
  final int totalPrice;
  final int paidAmount;

  const InstallmentDaySelectSheet({
    super.key,
    required this.nextDay,
    required this.totalDays,
    required this.dailyPayment,
    required this.totalPrice,
    required this.paidAmount,
  });

  @override
  State<InstallmentDaySelectSheet> createState() =>
      _InstallmentDaySelectSheetState();
}

class _InstallmentDaySelectSheetState extends State<InstallmentDaySelectSheet> {
  // The highest day currently selected. Days nextDay.._upToDay are paid.
  late int _upToDay;

  @override
  void initState() {
    super.initState();
    _upToDay = widget.nextDay;
  }

  int get _remainingDays => widget.totalDays - widget.nextDay + 1;
  int get _selectedCount => _upToDay - widget.nextDay + 1;

  // Total amount for paying nextDay.._upToDay. The final day takes whatever is
  // left so the sum matches the backend exactly.
  int get _selectedAmount {
    if (_upToDay >= widget.totalDays) {
      return (widget.totalPrice - widget.paidAmount).clamp(0, widget.totalPrice);
    }
    return widget.dailyPayment * _selectedCount;
  }

  void _setUpToDay(int day) {
    setState(() {
      _upToDay = day.clamp(widget.nextDay, widget.totalDays);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AppSheet(
      title: tr('purchase.select_days_title'),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('purchase.select_days_subtitle'), style: AppText.caption),
          const SizedBox(height: 14),

          // Quick presets
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _PresetChip(
                label: tr('purchase.preset_one_day'),
                selected: _selectedCount == 1,
                onTap: () => _setUpToDay(widget.nextDay),
              ),
              if (_remainingDays >= 7)
                _PresetChip(
                  label: tr('purchase.preset_week'),
                  selected: _selectedCount == 7,
                  onTap: () => _setUpToDay(widget.nextDay + 6),
                ),
              if (_remainingDays >= 30)
                _PresetChip(
                  label: tr('purchase.preset_month'),
                  selected: _selectedCount == 30,
                  onTap: () => _setUpToDay(widget.nextDay + 29),
                ),
              _PresetChip(
                label: tr('purchase.preset_all_remaining',
                    {'count': _remainingDays}),
                selected: _upToDay >= widget.totalDays,
                onTap: () => _setUpToDay(widget.totalDays),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Day checklist
          Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.32,
            ),
            decoration: BoxDecoration(
              color: CustomColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CustomColors.surfaceBorder),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(vertical: 4),
              itemCount: _remainingDays,
              itemBuilder: (context, i) {
                final day = widget.nextDay + i;
                final selected = day <= _upToDay;
                final isLast = day >= widget.totalDays;
                final amt = isLast
                    ? (widget.totalPrice -
                            widget.paidAmount -
                            widget.dailyPayment * i)
                        .clamp(0, widget.totalPrice)
                    : widget.dailyPayment;
                return InkWell(
                  onTap: () => _setUpToDay(day),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selected
                              ? Icons.check_box_rounded
                              : Icons.check_box_outline_blank_rounded,
                          size: 18,
                          color: selected
                              ? CustomColors.accent
                              : CustomColors.textTertiary,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            tr('purchase.day_single', {'day': day}),
                            style: selected
                                ? AppText.bodyBold.copyWith(fontSize: 13)
                                : AppText.body.copyWith(
                                    fontSize: 13,
                                    color: CustomColors.textSecondary),
                          ),
                        ),
                        Text(
                          formatMNT(amt),
                          style: AppText.caption.copyWith(
                            color: selected
                                ? Colors.white
                                : CustomColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 14),

          // Summary
          AppCard(
            color: CustomColors.surfaceAlt,
            radius: 16,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: AppInfoRow(
              label: tr('purchase.selected_days', {
                'count': _selectedCount,
                'range': _selectedCount > 1
                    ? ' (${widget.nextDay}–$_upToDay)'
                    : '',
              }),
              value: formatMNT(_selectedAmount),
              valueColor: CustomColors.accent,
            ),
          ),

          const SizedBox(height: 14),
          AppPrimaryButton(
            label: tr('purchase.pay'),
            onPressed: () => Navigator.of(context).pop(_selectedCount),
          ),
        ],
      ),
    );
  }
}

/// Хурдан сонголтын pill: сонгосон = алтан дэвсгэр хар текст,
/// бусад = surfaceAlt дээр цагаан текст
class _PresetChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _PresetChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? CustomColors.accent : CustomColors.surfaceAlt,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: selected ? AppText.bold : AppText.medium,
            fontSize: 12.5,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            color: selected ? Colors.black : Colors.white,
          ),
        ),
      ),
    );
  }
}
