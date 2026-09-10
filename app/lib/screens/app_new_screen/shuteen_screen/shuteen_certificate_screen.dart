import 'package:flutter/material.dart';
import 'package:pretty_qr_code/pretty_qr_code.dart';
import 'package:share_plus/share_plus.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/shuteen_model.dart';
import 'package:onegrgold/repositories/shuteen_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Цахим гэрчилгээ: дугаар, эзэмшигч, нэгж, дүн, огноо, буцаалт, QR.
class ShuteenCertificateScreen extends StatefulWidget {
  const ShuteenCertificateScreen({super.key, required this.orderId});
  final String orderId;

  @override
  State<ShuteenCertificateScreen> createState() =>
      _ShuteenCertificateScreenState();
}

class _ShuteenCertificateScreenState extends State<ShuteenCertificateScreen> {
  late final Stream<ShuteenOrder?> _stream =
      ShuteenRepository().watchOrder(widget.orderId);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('shuteen.certificate')),
      body: StreamBuilder<ShuteenOrder?>(
        stream: _stream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
                child: CircularProgressIndicator(
                    color: CustomColors.accent, strokeWidth: 2));
          }
          final o = snapshot.data;
          if (o == null) {
            return AppEmptyState(
              icon: Icons.error_outline_rounded,
              iconColor: CustomColors.negative,
              title: tr('shuteen.no_certificates'),
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              _CertificateCard(order: o),
              const SizedBox(height: 12),
              AppCard(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Column(
                  children: [
                    AppInfoRow(
                        label: tr('shuteen.owner'), value: o.buyerName),
                    const AppDivider(vertical: 0),
                    AppInfoRow(
                        label: tr('shuteen.my_units'),
                        value: tr('shuteen.units_value', {'n': _fmt(o.units)})),
                    const AppDivider(vertical: 0),
                    AppInfoRow(
                        label: tr('shuteen.card_unit_price'),
                        value: formatMNT(o.unitPrice)),
                    const AppDivider(vertical: 0),
                    AppInfoRow(
                        label: tr('shuteen.my_invested'),
                        value: formatMNT(o.amount)),
                    const AppDivider(vertical: 0),
                    AppInfoRow(
                        label: tr('shuteen.purchased_at'),
                        value: _fmtDate(o.createdAt)),
                    const AppDivider(vertical: 0),
                    AppInfoRow(
                        label: tr('shuteen.buyback_at'),
                        value: _fmtDate(o.buybackAt)),
                    const AppDivider(vertical: 0),
                    AppInfoRow(
                        label: tr('shuteen.my_buyback'),
                        value: formatMNT(o.buybackTotal),
                        valueColor: CustomColors.accent),
                    if (o.tier > 0) ...[
                      const AppDivider(vertical: 0),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(tr('shuteen.calc_tier'),
                                  style:
                                      AppText.caption.copyWith(fontSize: 13)),
                            ),
                            AppStatusChip(
                              icon: Icons.workspace_premium_rounded,
                              label: tr('shuteen.tier_n',
                                  {'n': _roman(o.tier)}),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AppBanner(
                icon: Icons.qr_code_scanner_rounded,
                text: tr('shuteen.qr_hint'),
              ),
              const SizedBox(height: 16),
              AppPrimaryButton(
                label: tr('shuteen.share_certificate'),
                icon: Icons.ios_share_rounded,
                outlined: true,
                onPressed: () => SharePlus.instance.share(
                  ShareParams(
                    text: tr('shuteen.share_text', {
                      'units': _fmt(o.units),
                      'no': o.certificateNo,
                    }),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Гэрчилгээний "хуудас" — алтан хүрээ, толгой, QR, дугаар
class _CertificateCard extends StatelessWidget {
  const _CertificateCard({required this.order});
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

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            CustomColors.accent.withOpacity(0.55),
            CustomColors.accent.withOpacity(0.15),
            CustomColors.accent.withOpacity(0.55),
          ],
        ),
      ),
      padding: const EdgeInsets.all(1.5),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
        decoration: BoxDecoration(
          color: CustomColors.surface,
          borderRadius: BorderRadius.circular(21),
        ),
        child: Column(
          children: [
            Row(
              children: [
                AppIconTile(
                  size: 40,
                  color: CustomColors.accentSoft,
                  child: Icon(Icons.workspace_premium_rounded,
                      color: CustomColors.accent, size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tr('shuteen.company'),
                          style: AppText.label.copyWith(
                              color: CustomColors.accent,
                              fontSize: 9.5,
                              letterSpacing: 1.1)),
                      const SizedBox(height: 2),
                      Text(tr('shuteen.certificate'),
                          style: AppText.bodyBold.copyWith(fontSize: 14)),
                    ],
                  ),
                ),
                AppStatusChip(label: statusLabel, color: statusColor),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: SizedBox(
                width: 176,
                height: 176,
                child: PrettyQrView.data(
                  data: o.qrPayload,
                  decoration: const PrettyQrDecoration(
                    shape: PrettyQrSmoothSymbol(color: Color(0xFF14111F)),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(tr('shuteen.certificate_no'), style: AppText.caption),
            const SizedBox(height: 4),
            Text(
              o.certificateNo,
              style: AppText.display.copyWith(
                  fontSize: 26, color: CustomColors.accent, letterSpacing: 2),
            ),
            const SizedBox(height: 12),
            Text(
              tr('shuteen.units_value', {'n': _fmt(o.units)}),
              style: AppText.sectionTitle.copyWith(fontSize: 18),
            ),
            const SizedBox(height: 2),
            Text(o.buyerName, style: AppText.caption),
          ],
        ),
      ),
    );
  }
}

String _fmt(num n) => formatMNT(n).replaceAll('₮', '');
String _roman(int n) => const ['', 'I', 'II', 'III'][n.clamp(0, 3)];
String _fmtDate(DateTime? d) => d == null
    ? '—'
    : '${d.year}.${d.month.toString().padLeft(2, '0')}.${d.day.toString().padLeft(2, '0')}';
