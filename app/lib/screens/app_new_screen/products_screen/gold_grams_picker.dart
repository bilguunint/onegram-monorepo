import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Граммын сонголт: хурдан chip-үүд (0.1 / 0.2 / 0.3 / 0.5 / 1 / бүгд) ба
/// −/+ алхам. Бүх тооцоо САНТИГРАММ (0.01 гр) бүхэл тоогоор — float алдаагүй.
class GoldGramsPicker extends StatelessWidget {
  /// Одоогийн сонголт (гр).
  final double value;

  /// Дээд хязгаар (гр) — үлдсэн грамм эсвэл эдлэлийн нийт грамм.
  final double max;

  /// Алхам (гр), серверийн min_step_grams.
  final double step;

  /// "Бүгд" chip харуулах эсэх (дараагийн төлбөрт л хэрэгтэй).
  final bool showAll;

  /// −/+ алхмын мөр харуулах эсэх (эхлүүлэх sheet дээр зай хэмнэхийн тулд үгүй).
  final bool showStepper;
  final ValueChanged<double> onChanged;

  const GoldGramsPicker({
    super.key,
    required this.value,
    required this.max,
    required this.step,
    required this.onChanged,
    this.showAll = false,
    this.showStepper = true,
  });

  static int _cg(double g) => (g * 100).round();
  static double _g(int cg) => cg / 100;

  /// Сонгосон граммыг алхмын үржвэр ба [max]-д багтаана; үлдсэн нь алхмаас
  /// бага бол тэр үлдсэнийг зөвшөөрнө (серверийн normalizeGramsCg-тэй ижил).
  static double clampGrams(double g, double max, double step) {
    final maxCg = _cg(max);
    final stepCg = _cg(step);
    var cg = _cg(g);
    if (cg >= maxCg) return _g(maxCg);
    if (cg < stepCg) cg = stepCg;
    cg -= cg % stepCg;
    return _g(cg.clamp(stepCg, maxCg));
  }

  @override
  Widget build(BuildContext context) {
    final maxCg = _cg(max);
    final stepCg = _cg(step);
    final curCg = _cg(value);
    final presets = <int>[10, 20, 30, 50, 100]
        .where((cg) => cg % stepCg == 0 && cg < maxCg)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final cg in presets)
              _Chip(
                label: formatGrams(_g(cg)),
                selected: curCg == cg,
                onTap: () => onChanged(_g(cg)),
              ),
            if (showAll)
              _Chip(
                label: tr('gold.all_remaining', {'grams': formatGrams(max)}),
                selected: curCg >= maxCg,
                onTap: () => onChanged(_g(maxCg)),
              ),
          ],
        ),
        if (showStepper) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              _StepButton(
                icon: Icons.remove_rounded,
                enabled: curCg > stepCg,
                onTap: () =>
                    onChanged(clampGrams(_g(curCg - stepCg), max, step)),
              ),
              Expanded(
                child: Center(
                  child: Text(
                    formatGrams(value),
                    style: AppText.display
                        .copyWith(fontSize: 26, color: CustomColors.accent),
                  ),
                ),
              ),
              _StepButton(
                icon: Icons.add_rounded,
                enabled: curCg < maxCg,
                onTap: () =>
                    onChanged(clampGrams(_g(curCg + stepCg), max, step)),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _Chip(
      {required this.label, required this.selected, required this.onTap});

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

class _StepButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;
  const _StepButton(
      {required this.icon, required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AppIconTile(
      size: 44,
      color: enabled ? CustomColors.accentSoft : CustomColors.surfaceAlt,
      child: IconButton(
        padding: EdgeInsets.zero,
        onPressed: enabled ? onTap : null,
        icon: Icon(icon,
            color: enabled ? CustomColors.accent : CustomColors.textTertiary),
      ),
    );
  }
}
