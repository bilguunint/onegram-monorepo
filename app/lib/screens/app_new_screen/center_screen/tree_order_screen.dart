import 'package:flutter/material.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_payment_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

/// Forest-green palette for the tree-planting flow.
const kForestGreen = Color(0xFF2E7D32);
const kLeafGreen = Color(0xFF66BB6A);

/// Order form for planting a named tree at the Morin Khuur center complex.
/// Collects the plaque name (шошго), quantity, and starts the QPay checkout.
class TreeOrderScreen extends StatefulWidget {
  final CenterProductItem tree;
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

  Future<void> _submit() async {
    final label = _labelCtrl.text.trim();
    if (label.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Шошгон дээр хэвлэгдэх нэрээ оруулна уу.'),
          backgroundColor: CustomColors.alerRed,
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
            backgroundColor: CustomColors.alerRed,
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
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Мод тарих захиалга',
          style: TextStyle(
              fontFamily: 'InterBold', fontSize: 13, color: Colors.white),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _treeCard(tree),
                const SizedBox(height: 14),
                _labelSection(),
                const SizedBox(height: 14),
                _qtySection(),
                const SizedBox(height: 14),
                _vibeNote(),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: GestureDetector(
                onTap: _submitting ? null : _submit,
                child: Container(
                  height: 46,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [kForestGreen, kLeafGreen],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.park_rounded,
                                size: 18, color: Colors.white),
                            const SizedBox(width: 8),
                            Text(
                              '${formatMNT(_total)} — Мод тарих',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _treeCard(CenterProductItem tree) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kForestGreen.withOpacity(0.4)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: const Color(0xFF252528),
              child: tree.coverImage != null
                  ? Image.network(
                      tree.coverImage!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Icon(Icons.forest_rounded,
                            color: kLeafGreen, size: 40),
                      ),
                    )
                  : const Center(
                      child: Icon(Icons.forest_rounded,
                          color: kLeafGreen, size: 40),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tree.name,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700),
                ),
                if (tree.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    tree.description,
                    style: const TextStyle(
                        color: Colors.white60, fontSize: 11.5, height: 1.4),
                  ),
                ],
                const SizedBox(height: 6),
                Text(
                  formatMNT(tree.price),
                  style: const TextStyle(
                    color: kLeafGreen,
                    fontFamily: 'RubikBold',
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _labelSection() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.badge_rounded, size: 15, color: kLeafGreen),
              SizedBox(width: 6),
              Text(
                'Шошгон дээр хэвлэгдэх нэр',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Таны модонд энэ нэр бүхий шошго хадагдана.',
            style: TextStyle(color: Colors.white54, fontSize: 11),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _labelCtrl,
            maxLength: 40,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Жишээ: Билгүүн гэр бүлийн мод',
              hintStyle: const TextStyle(color: Colors.white30, fontSize: 12),
              counterStyle:
                  const TextStyle(color: Colors.white38, fontSize: 10),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          if (_labelCtrl.text.trim().isNotEmpty) ...[
            const SizedBox(height: 6),
            // Live plaque preview.
            Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: kForestGreen.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: kLeafGreen.withOpacity(0.5)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.eco_rounded, size: 14, color: kLeafGreen),
                    const SizedBox(width: 6),
                    Text(
                      _labelCtrl.text.trim(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontFamily: 'RubikBold',
                        fontSize: 13,
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Тарих модны тоо',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: kLeafGreen.withOpacity(0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _stepBtn(Icons.remove,
                    () => setState(() => _qty = _qty > 1 ? _qty - 1 : 1)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text('$_qty',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold)),
                ),
                _stepBtn(Icons.add, () => setState(() => _qty++)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 36,
        height: 34,
        child: Icon(icon, size: 17, color: kLeafGreen),
      ),
    );
  }

  Widget _vibeNote() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kForestGreen.withOpacity(0.10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kForestGreen.withOpacity(0.35)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.energy_savings_leaf_rounded, size: 16, color: kLeafGreen),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Таны тарьсан мод Дэлхийн морин хуурын төв цогцолборын хотхонд '
              'олон жил ургаж, ирээдүй хойч үед ногоон өв үлдээнэ. Мод бүрд '
              'таны нэрийн шошго хадагдана.',
              style:
                  TextStyle(color: Colors.white70, fontSize: 11.5, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
