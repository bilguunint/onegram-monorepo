import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/center_screen/tree_order_screen.dart'
    show kForestGreen, kLeafGreen;
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

/// Lists the current user's tree-planting orders with a forest vibe. Each row
/// shows the engraved plaque name and whether the tree has been planted yet.
class CenterMyTreeOrdersScreen extends StatelessWidget {
  final CenterRepository repo;
  const CenterMyTreeOrdersScreen({super.key, required this.repo});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          tr('center.my_planted_trees'),
          style: const TextStyle(
              fontFamily: 'InterBold', fontSize: 13, color: Colors.white),
        ),
        centerTitle: false,
      ),
      body: uid == null
          ? Center(
              child: Text(tr('common.sign_in_required'),
                  style: const TextStyle(color: Colors.white54, fontSize: 13)),
            )
          : StreamBuilder<List<CenterTreeOrder>>(
              stream: repo.watchMyTreeOrders(uid),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.white24),
                  );
                }
                final orders = snapshot.data!;
                if (orders.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.forest_rounded,
                            color: kLeafGreen, size: 48),
                        const SizedBox(height: 12),
                        Text(tr('center.no_trees_planted_yet'),
                            style: const TextStyle(
                                color: Colors.white54, fontSize: 13)),
                      ],
                    ),
                  );
                }
                final totalTrees = orders.fold<int>(0, (s, o) => s + o.qty);
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _summary(totalTrees),
                    const SizedBox(height: 12),
                    ...orders.map((o) => _TreeOrderTile(order: o)),
                  ],
                );
              },
            ),
    );
  }

  Widget _summary(int totalTrees) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            kForestGreen.withOpacity(0.28),
            kForestGreen.withOpacity(0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kForestGreen.withOpacity(0.45)),
      ),
      child: Row(
        children: [
          const Icon(Icons.forest_rounded, size: 30, color: kLeafGreen),
          const SizedBox(width: 12),
          Expanded(
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: tr('center.you_planted_prefix'),
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  TextSpan(
                    text: tr('center.trees_count_value', {'count': totalTrees}),
                    style: const TextStyle(
                      color: kLeafGreen,
                      fontFamily: 'RubikBold',
                      fontSize: 16,
                    ),
                  ),
                  TextSpan(
                    text: tr('center.you_planted_suffix'),
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _two(int n) => n.toString().padLeft(2, '0');
String _fmtDate(DateTime? d) =>
    d == null ? '—' : '${d.year}-${_two(d.month)}-${_two(d.day)}';

class _TreeOrderTile extends StatelessWidget {
  final CenterTreeOrder order;
  const _TreeOrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kForestGreen.withOpacity(0.30)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 52,
              height: 52,
              child: order.treeImage != null && order.treeImage!.isNotEmpty
                  ? Image.network(
                      order.treeImage!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _thumbFallback(),
                    )
                  : _thumbFallback(),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        order.qty > 1
                            ? '${order.treeName} ×${order.qty}'
                            : order.treeName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      formatMNT(order.amount),
                      style: const TextStyle(
                        color: kLeafGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // Engraved plaque name.
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: kForestGreen.withOpacity(0.14),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: kLeafGreen.withOpacity(0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.eco_rounded,
                          size: 12, color: kLeafGreen),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          order.labelName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'RubikBold',
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _fmtDate(order.createdAt),
                      style:
                          const TextStyle(color: Colors.white38, fontSize: 11),
                    ),
                    _statusBadge(order.isPlanted),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _thumbFallback() => Container(
        color: const Color(0xFF223022),
        child: const Center(
          child: Icon(Icons.forest_rounded, color: kLeafGreen, size: 24),
        ),
      );

  Widget _statusBadge(bool planted) {
    final color = planted ? CustomColors.successGreen : CustomColors.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(planted ? Icons.check_circle_rounded : Icons.schedule_rounded,
              size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            planted ? tr('center.planted') : tr('center.awaiting_planting'),
            style: TextStyle(
                color: color, fontSize: 10.5, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
