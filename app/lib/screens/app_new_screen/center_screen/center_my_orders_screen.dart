import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/repositories/center_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class CenterMyOrdersScreen extends StatelessWidget {
  final CenterRepository repo;
  const CenterMyOrdersScreen({super.key, required this.repo});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('center.my_support_title')),
      body: uid == null
          ? AppEmptyState(
              icon: Icons.lock_outline_rounded,
              title: tr('common.sign_in_required'),
            )
          : StreamBuilder<List<CenterDonationOrder>>(
              stream: repo.watchMyDonations(uid),
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
                    icon: Icons.receipt_long_outlined,
                    title: tr('center.no_support_orders'),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) => _OrderTile(order: orders[i]),
                );
              },
            ),
    );
  }
}

String _two(int n) => n.toString().padLeft(2, '0');

String _fmtDate(DateTime? d) => d == null
    ? '—'
    : '${d.year}-${_two(d.month)}-${_two(d.day)} ${_two(d.hour)}:${_two(d.minute)}';

String _fmtDay(DateTime? d) =>
    d == null ? '—' : '${d.year}-${_two(d.month)}-${_two(d.day)}';

/// Захиалгын төлөвийн chip — хүлээж авсан бол саарал, эсвэл авах код бэлэн.
Widget _statusChip(CenterDonationOrder order) => order.isDelivered
    ? AppStatusChip(
        label: tr('center.goods_received'),
        color: CustomColors.textSecondary,
        icon: Icons.check_circle_rounded,
      )
    : AppStatusChip(
        label: tr('center.view_code'),
        color: CustomColors.accent,
        icon: Icons.qr_code_2_rounded,
      );

class _OrderTile extends StatelessWidget {
  final CenterDonationOrder order;
  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final itemsText = order.items
        .map((it) => '${it.name}${it.qty > 1 ? ' ×${it.qty}' : ''}')
        .join(', ');

    return GestureDetector(
      onTap: () {
        showModalBottomSheet<void>(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _OrderDetailSheet(order: order),
        );
      },
      child: AppCard(
        padding: const EdgeInsets.all(12),
        radius: 16,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppIconTile(
              child: Icon(
                order.isDelivered
                    ? Icons.inventory_2_outlined
                    : Icons.volunteer_activism_rounded,
                size: 22,
                color: order.isDelivered
                    ? CustomColors.textSecondary
                    : CustomColors.accent,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    itemsText.isNotEmpty
                        ? itemsText
                        : tr('center.order_details'),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodyBold,
                  ),
                  const SizedBox(height: 4),
                  Text(_fmtDate(order.createdAt), style: AppText.caption),
                  const SizedBox(height: 8),
                  _statusChip(order),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(formatMNT(order.amount), style: AppText.bodyBold),
                const SizedBox(height: 4),
                Icon(Icons.chevron_right_rounded,
                    size: 18, color: CustomColors.textSecondary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderDetailSheet extends StatelessWidget {
  final CenterDonationOrder order;
  const _OrderDetailSheet({required this.order});

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: AppSheet(
        child: Flexible(
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        tr('center.order_details'),
                        style: AppText.sectionTitle.copyWith(fontSize: 18),
                      ),
                    ),
                    _statusChip(order),
                  ],
                ),
                const SizedBox(height: 14),
                // Items
                AppCard(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  radius: 16,
                  color: CustomColors.surfaceAlt,
                  child: Column(
                    children: [
                      ...order.items.map(
                        (it) => AppInfoRow(
                          label:
                              '${it.name}${it.qty > 1 ? '  ×${it.qty}' : ''}',
                          value: formatMNT(it.price * it.qty),
                          dense: true,
                        ),
                      ),
                      const AppDivider(),
                      AppInfoRow(
                        label: tr('center.total_amount'),
                        value: formatMNT(order.amount),
                        valueColor: CustomColors.accent,
                      ),
                      const SizedBox(height: 2),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(_fmtDate(order.createdAt),
                            style: AppText.caption),
                      ),
                      const SizedBox(height: 4),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (order.isDelivered)
                  _receivedCard()
                else if (order.pickupCode.isNotEmpty)
                  _codeCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _codeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
      decoration: BoxDecoration(
        color: CustomColors.accent.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CustomColors.accent.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(Icons.qr_code_2_rounded, size: 30, color: CustomColors.accent),
          const SizedBox(height: 8),
          Text(tr('center.pickup_code'), style: AppText.caption),
          const SizedBox(height: 10),
          Text(
            order.pickupCode,
            style: AppText.display.copyWith(
              color: CustomColors.accent,
              fontSize: 38,
              letterSpacing: 8,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            tr('center.pickup_code_hint'),
            textAlign: TextAlign.center,
            style: AppText.caption,
          ),
        ],
      ),
    );
  }

  Widget _receivedCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: CustomColors.positive.withOpacity(0.10),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CustomColors.positive.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(Icons.check_circle_rounded,
              size: 32, color: CustomColors.positive),
          const SizedBox(height: 8),
          Text(tr('center.goods_received'), style: AppText.sectionTitle),
          const SizedBox(height: 8),
          Text(
            tr('center.received_on', {'date': _fmtDay(order.deliveredAt)}),
            style: AppText.bodyBold
                .copyWith(color: CustomColors.positive, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            tr('center.received_note'),
            textAlign: TextAlign.center,
            style: AppText.caption,
          ),
        ],
      ),
    );
  }
}
