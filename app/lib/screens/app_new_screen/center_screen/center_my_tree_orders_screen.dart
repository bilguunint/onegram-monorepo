import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Lists the current user's tree-planting orders. Each row shows the engraved
/// plaque name and whether the tree has been planted yet.
class CenterMyTreeOrdersScreen extends StatelessWidget {
  final CenterRepository repo;
  const CenterMyTreeOrdersScreen({super.key, required this.repo});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('center.my_planted_trees')),
      body: uid == null
          ? AppEmptyState(
              icon: Icons.lock_outline_rounded,
              title: tr('common.sign_in_required'),
            )
          : StreamBuilder<List<CenterTreeOrder>>(
              stream: repo.watchMyTreeOrders(uid),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return AppEmptyState(
                    icon: Icons.error_outline_rounded,
                    iconColor: CustomColors.negative,
                    title: tr('common.error'),
                    subtitle: snapshot.error
                        .toString()
                        .replaceFirst('Exception: ', ''),
                  );
                }
                if (!snapshot.hasData) {
                  return Center(
                    child: CircularProgressIndicator(
                        color: CustomColors.accent, strokeWidth: 2),
                  );
                }
                final orders = snapshot.data!;
                if (orders.isEmpty) {
                  return AppEmptyState(
                    icon: Icons.forest_rounded,
                    title: tr('center.no_trees_planted_yet'),
                  );
                }
                final totalTrees = orders.fold<int>(0, (s, o) => s + o.qty);
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  children: [
                    _summary(totalTrees),
                    const SizedBox(height: 12),
                    for (int i = 0; i < orders.length; i++) ...[
                      if (i > 0) const SizedBox(height: 12),
                      _TreeOrderTile(order: orders[i]),
                    ],
                  ],
                );
              },
            ),
    );
  }

  Widget _summary(int totalTrees) {
    return AppCard(
      child: Row(
        children: [
          AppIconTile(
            child: Icon(Icons.forest_rounded,
                size: 24, color: CustomColors.accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            // Text.rich (not RichText) so the user's font-size setting applies.
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: tr('center.you_planted_prefix'),
                    style: AppText.body.copyWith(fontSize: 13),
                  ),
                  TextSpan(
                    text: tr('center.trees_count_value', {'count': totalTrees}),
                    style: AppText.bodyBold
                        .copyWith(color: CustomColors.accent, fontSize: 16),
                  ),
                  TextSpan(
                    text: tr('center.you_planted_suffix'),
                    style: AppText.body.copyWith(fontSize: 13),
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
    return AppCard(
      padding: const EdgeInsets.all(12),
      radius: 16,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _thumb(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.qty > 1
                      ? '${order.treeName} ×${order.qty}'
                      : order.treeName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodyBold,
                ),
                const SizedBox(height: 4),
                Text(_fmtDate(order.createdAt), style: AppText.caption),
                const SizedBox(height: 8),
                // Engraved plaque name.
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: CustomColors.accentSoft,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.eco_rounded,
                          size: 12, color: CustomColors.accent),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          order.labelName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.label
                              .copyWith(color: CustomColors.accent),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatMNT(order.amount), style: AppText.bodyBold),
              const SizedBox(height: 6),
              _statusChip(order.isPlanted),
            ],
          ),
        ],
      ),
    );
  }

  Widget _thumb() {
    final String? url = order.treeImage;
    if (url == null || url.isEmpty) return _thumbFallback();
    return ClipRRect(
      borderRadius: BorderRadius.circular(13),
      child: SizedBox(
        width: 46,
        height: 46,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _thumbFallback(),
        ),
      ),
    );
  }

  Widget _thumbFallback() => const AppIconTile(
        child: Icon(Icons.forest_rounded, color: Colors.white24, size: 22),
      );

  Widget _statusChip(bool planted) => planted
      ? AppStatusChip(
          label: tr('center.planted'),
          color: CustomColors.positive,
          icon: Icons.check_circle_rounded,
        )
      : AppStatusChip(
          label: tr('center.awaiting_planting'),
          color: CustomColors.accent,
          icon: Icons.schedule_rounded,
        );
}
