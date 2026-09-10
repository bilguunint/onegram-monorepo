import 'package:flutter/material.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_certificate_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Хэрэглэгчийн бүх гэрчилгээний жагсаалт
class ShuteenMyOrdersScreen extends StatefulWidget {
  const ShuteenMyOrdersScreen({super.key, required this.uid});
  final String uid;

  @override
  State<ShuteenMyOrdersScreen> createState() => _ShuteenMyOrdersScreenState();
}

class _ShuteenMyOrdersScreenState extends State<ShuteenMyOrdersScreen> {
  late final Stream<List<ShuteenOrder>> _stream =
      ShuteenRepository().watchMyOrders(widget.uid);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('shuteen.my_certificates')),
      body: StreamBuilder<List<ShuteenOrder>>(
        stream: _stream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
                child: CircularProgressIndicator(
                    color: CustomColors.accent, strokeWidth: 2));
          }
          final list = snapshot.data ?? const <ShuteenOrder>[];
          if (list.isEmpty) {
            return AppEmptyState(
              icon: Icons.workspace_premium_outlined,
              title: tr('shuteen.no_certificates'),
              subtitle: tr('shuteen.no_certificates_sub'),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => ShuteenOrderTile(order: list[i]),
          );
        },
      ),
    );
  }
}

/// Нэг гэрчилгээний мөр — дугаар, нэгж, дүн, огноо, төлөв
class ShuteenOrderTile extends StatelessWidget {
  const ShuteenOrderTile({super.key, required this.order});
  final ShuteenOrder order;

  @override
  Widget build(BuildContext context) {
    final o = order;
    final Color statusColor = o.status == 'active'
        ? CustomColors.positive
        : o.status == 'bought_back'
            ? CustomColors.textSecondary
            : CustomColors.negative;
    final String statusLabel = o.status == 'active'
        ? tr('shuteen.status_active')
        : o.status == 'bought_back'
            ? tr('shuteen.status_bought_back')
            : tr('shuteen.status_cancelled');

    return Material(
      color: CustomColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
              builder: (_) => ShuteenCertificateScreen(orderId: o.id)),
        ),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(width: 1.0, color: CustomColors.surfaceBorder),
          ),
          child: Row(
            children: [
              AppIconTile(
                size: 46,
                color: CustomColors.accentSoft,
                child: Icon(Icons.qr_code_2_rounded,
                    color: CustomColors.accent, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(o.certificateNo,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.bodyBold),
                        ),
                        AppStatusChip(label: statusLabel, color: statusColor),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${tr('shuteen.units_value', {'n': _fmt(o.units)})} · ${_fmtDate(o.createdAt)}',
                      style: AppText.caption,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(formatMNT(o.amount), style: AppText.bodyBold),
                  const SizedBox(height: 2),
                  Text(
                    '→ ${formatMNT(o.buybackTotal)}',
                    style: AppText.caption
                        .copyWith(fontSize: 11, color: CustomColors.accent),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _fmt(num n) => formatMNT(n).replaceAll('₮', '');
String _fmtDate(DateTime? d) => d == null
    ? '—'
    : '${d.year}.${d.month.toString().padLeft(2, '0')}.${d.day.toString().padLeft(2, '0')}';
