import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Алтан хуримтлалын зорилтын сонголтууд (грамм).
const List<int> kGoldGoalOptions = [1, 10, 50, 100];

/// Хэрэглэгчийн алтан хуримтлалын зорилт: 1 / 10 / 50 / 100 гр.
///
/// Хадгалагдсан зорилтыг `users/{uid}.gold_goal_grams`-аас уншиж урьдчилан
/// сонгоно; шинээр сонгоход тэр даруй хадгална (`gold_goal_updated_at`-тай).
/// [onChanged] нь сонгосон граммыг (хадгалсны дараа) эцэг widget-д мэдэгдэнэ.
class GoldGoalSelector extends StatefulWidget {
  final ValueChanged<int?> onChanged;

  const GoldGoalSelector({super.key, required this.onChanged});

  @override
  State<GoldGoalSelector> createState() => _GoldGoalSelectorState();
}

class _GoldGoalSelectorState extends State<GoldGoalSelector> {
  int? _selected;
  bool _saving = false;

  DocumentReference<Map<String, dynamic>>? get _userRef {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return null;
    return FirebaseFirestore.instance.collection('users').doc(uid);
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final ref = _userRef;
    if (ref == null) return;
    try {
      final snap = await ref.get().timeout(const Duration(seconds: 8));
      final g = (snap.data()?['gold_goal_grams'] as num?)?.toInt();
      if (!mounted) return;
      if (g != null && kGoldGoalOptions.contains(g)) {
        setState(() => _selected = g);
        widget.onChanged(g);
      }
    } catch (e) {
      debugPrint('gold_goal_grams уншихад алдаа: $e');
    }
  }

  Future<void> _select(int grams) async {
    if (_saving || grams == _selected) return;
    final prev = _selected;
    setState(() {
      _selected = grams;
      _saving = true;
    });
    try {
      final ref = _userRef;
      if (ref != null) {
        await ref.set({
          'gold_goal_grams': grams,
          'gold_goal_updated_at': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }
      widget.onChanged(grams);
    } catch (e) {
      debugPrint('gold_goal_grams хадгалахад алдаа: $e');
      if (!mounted) return;
      setState(() => _selected = prev);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('order.goal_save_failed'))),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tr('order.goal_title'), style: AppText.bodyBold),
        const SizedBox(height: 2),
        Text(
          tr('order.goal_hint'),
          style: AppText.caption.copyWith(color: CustomColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final g in kGoldGoalOptions) ...[
              Expanded(child: _GoalChip(
                grams: g,
                selected: _selected == g,
                onTap: () => _select(g),
              )),
              if (g != kGoldGoalOptions.last) const SizedBox(width: 8),
            ],
          ],
        ),
      ],
    );
  }
}

class _GoalChip extends StatelessWidget {
  final int grams;
  final bool selected;
  final VoidCallback onTap;

  const _GoalChip({
    required this.grams,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? CustomColors.accent.withValues(alpha: 0.16)
              : CustomColors.surfaceAlt,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? CustomColors.accent : CustomColors.surfaceBorder,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          tr('order.goal_grams', {'grams': grams}),
          style: AppText.bodyBold.copyWith(
            fontSize: 13,
            color: selected ? CustomColors.accent : Colors.white,
          ),
        ),
      ),
    );
  }
}
