import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Forest-green palette of the legacy tree-planting flow. Kept exported for
/// screens that still import it (center_detail_screen, center_promo_popup);
/// this screen itself now uses the shared dark-gold design tokens.
const kForestGreen = Color(0xFF2E7D32);
const kLeafGreen = Color(0xFF66BB6A);

/// Order form for planting a named tree at the Morin Khuur center complex.
/// Collects the plaque name (шошго), quantity, and starts the QPay checkout.
class TreeOrderScreen extends StatefulWidget {
  final CenterTreeItem tree;
  const TreeOrderScreen({super.key, required this.tree});

  @override
  State<TreeOrderScreen> createState() => _TreeOrderScreenState();
}

class _TreeOrderScreenState extends State<TreeOrderScreen> {
  final CenterRepository _repo = CenterRepository();
  final _labelCtrl = TextEditingController();
  int _qty = 1;
  bool _submitting = false;

  @override
  void dispose() {
    _labelCtrl.dispose();
    super.dispose();
  }

  int get _total => widget.tree.price * _qty;

  /// Remaining stock caps the stepper so the user can't build an order the
  /// backend will reject. Unlimited trees still get a sane ceiling.
  int get _maxQty {
    final stock = widget.tree.stock;
    if (stock == null) return 50;
    return stock < 1 ? 1 : stock;
  }

  Future<void> _submit() async {
    final label = _labelCtrl.text.trim();
    if (label.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr('center.enter_plaque_name')),
          backgroundColor: CustomColors.negative,
        ),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final checkout = await _repo.createTreeOrder(
        treeId: widget.tree.id,
        qty: _qty,
        labelName: label,
      );
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => TreePaymentScreen(
            pendingId: checkout.pendingId,
            amount: checkout.amount,
            invoice: checkout.invoice,
            labelName: label,
            treeName: widget.tree.name,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: CustomColors.negative,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tree = widget.tree;
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('center.tree_order_title')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          _treeCard(tree),
          const SizedBox(height: 12),
          _labelSection(),
          const SizedBox(height: 12),
          _qtySection(),
          const SizedBox(height: 12),
          _summaryCard(),
          const SizedBox(height: 12),
          AppBanner(
            icon: Icons.energy_savings_leaf_rounded,
            text: tr('center.plant_vibe_note'),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: AppPrimaryButton(
            icon: Icons.park_rounded,
            label: tree.inStock
                ? tr('center.plant_for_amount', {'amount': formatMNT(_total)})
                : tr('center.tree_out_of_stock'),
            loading: _submitting,
            onPressed: (_submitting || !tree.inStock) ? null : _submit,
          ),
        ),
      ),
    );
  }

  Widget _treeCard(CenterTreeItem tree) {
    final bool hasSpecs = tree.seedlingHeight.trim().isNotEmpty ||
        tree.matureHeight.trim().isNotEmpty ||
        tree.lifespan.trim().isNotEmpty ||
        tree.features.trim().isNotEmpty;
    return AppCard(
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: AspectRatio(
              aspectRatio: 4 / 3,
              child: Container(
                color: CustomColors.surfaceAlt,
                child: tree.coverImage != null
                    ? Image.network(
                        tree.coverImage!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.forest_rounded,
                              color: Colors.white24, size: 40),
                        ),
                      )
                    : const Center(
                        child: Icon(Icons.forest_rounded,
                            color: Colors.white24, size: 40),
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(tree.name,
                          style: AppText.sectionTitle),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      formatMNT(tree.price),
                      style: AppText.bodyBold.copyWith(
                          color: CustomColors.accent, fontSize: 16),
                    ),
                  ],
                ),
                if (hasSpecs) ...[
                  const SizedBox(height: 10),
                  _specsBox(tree),
                ],
                if (tree.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(tree.description, style: AppText.caption),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Botanical facts of the tree (нас бие хүрсэн өндөр, насжилт, онцлог).
  Widget _specsBox(CenterTreeItem tree) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (tree.seedlingHeight.trim().isNotEmpty)
            AppInfoRow(
              dense: true,
              icon: Icons.grass_rounded,
              label: tr('center.seedling_height'),
              value: tree.seedlingHeight,
            ),
          if (tree.matureHeight.trim().isNotEmpty)
            AppInfoRow(
              dense: true,
              icon: Icons.height_rounded,
              label: tr('center.mature_height'),
              value: tree.matureHeight,
            ),
          if (tree.lifespan.trim().isNotEmpty)
            AppInfoRow(
              dense: true,
              icon: Icons.hourglass_bottom_rounded,
              label: tr('center.lifespan'),
              value: tree.lifespan,
            ),
          if (tree.features.trim().isNotEmpty)
            AppInfoRow(
              dense: true,
              icon: Icons.auto_awesome_rounded,
              label: tr('center.features'),
              value: tree.features,
            ),
        ],
      ),
    );
  }

  Widget _labelSection() {
    final String preview = _labelCtrl.text.trim();
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.badge_rounded,
                  size: 16, color: CustomColors.textSecondary),
              const SizedBox(width: 6),
              Text(tr('center.plaque_name'), style: AppText.bodyBold),
            ],
          ),
          const SizedBox(height: 4),
          Text(tr('center.plaque_name_hint'), style: AppText.caption),
          const SizedBox(height: 12),
          TextField(
            controller: _labelCtrl,
            maxLength: 40,
            textCapitalization: TextCapitalization.words,
            style: AppText.body,
            cursorColor: CustomColors.accent,
            onChanged: (_) => setState(() {}),
            decoration: appInputDecoration(
              hint: tr('center.plaque_name_placeholder'),
            ).copyWith(counterStyle: AppText.caption.copyWith(fontSize: 11)),
          ),
          if (preview.isNotEmpty) ...[
            const SizedBox(height: 4),
            // Live plaque preview.
            Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: CustomColors.accentSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.eco_rounded,
                        size: 14, color: CustomColors.accent),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        preview,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodyBold
                            .copyWith(color: CustomColors.accent),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _qtySection() {
    final int? stock = widget.tree.stock;
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(tr('center.tree_qty'), style: AppText.bodyBold),
                if (stock != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    stock > 0
                        ? tr('center.stock_left', {'stock': stock})
                        : tr('center.stock_empty'),
                    style: AppText.caption.copyWith(
                      color: stock <= 20
                          ? CustomColors.accent
                          : CustomColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            decoration: BoxDecoration(
              color: CustomColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _stepBtn(Icons.remove_rounded,
                    () => setState(() => _qty = _qty > 1 ? _qty - 1 : 1)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text('$_qty',
                      style: AppText.bodyBold.copyWith(fontSize: 16)),
                ),
                _stepBtn(
                  Icons.add_rounded,
                  _qty >= _maxQty ? null : () => setState(() => _qty++),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepBtn(IconData icon, VoidCallback? onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 40,
        height: 40,
        child: Icon(icon,
            size: 20,
            color: onTap == null ? Colors.white24 : CustomColors.accent),
      ),
    );
  }

  /// Захиалгын товч дүгнэлт — тоо ширхэг ба нийт дүн.
  Widget _summaryCard() {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          AppInfoRow(
            label: tr('center.tree_qty'),
            value: '$_qty',
          ),
          const AppDivider(vertical: 2),
          AppInfoRow(
            label: tr('center.total_amount'),
            value: formatMNT(_total),
            valueColor: CustomColors.accent,
          ),
        ],
      ),
    );
  }
}
