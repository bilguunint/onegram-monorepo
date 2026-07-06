import 'package:flutter/material.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
    return SafeArea(
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1B1B1E),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Төлөх өдрүүдээ сонгоно уу',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Дараагийн төлөгдөөгүй өдрөөс эхлэн хэдэн ч өдрийг нэг дор '
              'төлж болно.',
              style: TextStyle(
                color: Colors.white.withOpacity(0.55),
                fontSize: 11.5,
              ),
            ),
            const SizedBox(height: 12),

            // Quick presets
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _PresetChip(
                  label: '1 өдөр',
                  selected: _selectedCount == 1,
                  onTap: () => _setUpToDay(widget.nextDay),
                ),
                if (_remainingDays >= 7)
                  _PresetChip(
                    label: '7 хоног',
                    selected: _selectedCount == 7,
                    onTap: () => _setUpToDay(widget.nextDay + 6),
                  ),
                if (_remainingDays >= 30)
                  _PresetChip(
                    label: '30 хоног',
                    selected: _selectedCount == 30,
                    onTap: () => _setUpToDay(widget.nextDay + 29),
                  ),
                _PresetChip(
                  label: 'Бүх үлдсэн ($_remainingDays)',
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
                color: const Color(0xFF161619),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
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
                                ? Icons.check_box
                                : Icons.check_box_outline_blank,
                            size: 18,
                            color: selected
                                ? CustomColors.mainColor
                                : Colors.white38,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '$day-р өдөр',
                              style: TextStyle(
                                color: selected ? Colors.white : Colors.white60,
                                fontSize: 12.5,
                                fontWeight: selected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                            ),
                          ),
                          Text(
                            formatMNT(amt),
                            style: TextStyle(
                              color: selected ? Colors.white : Colors.white38,
                              fontSize: 12,
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

            // Summary + confirm
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Сонгосон: $_selectedCount өдөр'
                        '${_selectedCount > 1 ? ' (${widget.nextDay}–$_upToDay)' : ''}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 11.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatMNT(_selectedAmount),
                        style: TextStyle(
                          color: CustomColors.mainColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () =>
                      Navigator.of(context).pop(_selectedCount),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CustomColors.mainColor,
                    foregroundColor: CustomColors.mainBlack,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 22,
                      vertical: 13,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  child: const Text('Төлөх'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

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
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? CustomColors.mainColor.withOpacity(0.15)
              : const Color(0xFF252528),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? CustomColors.mainColor
                : Colors.white.withOpacity(0.08),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? CustomColors.mainColor : Colors.white70,
            fontSize: 12,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
