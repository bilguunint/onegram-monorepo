import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/models/order_model.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen(
      {super.key,
      required this.makeOrder,
      required this.order,
      required this.userRepository,
      required this.uid});
  final MakeOrder makeOrder;
  final OrderModel order;
  final UserRepository userRepository;
  final String uid;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen>
    with SingleTickerProviderStateMixin {
  // A getter, not a field: resolved on every build so the labels follow a
  // live language switch instead of freezing at the language the screen
  // was opened in.
  List<String> get tabs => [
        tr('common.bank_app'),
        tr('order.transfer_tab'),
      ];
  final currencyFormatter = NumberFormat();
  late TabController _tabController;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    _tabController = TabController(vsync: this, length: tabs.length);
  }

  /// Хуулсны дараах snackbar — өмнөх шигээ, зөвхөн дэвсгэр өнгө токенжсон
  void _copy(String value) {
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
            backgroundColor: CustomColors.surface,
            content: Text(
              tr('order.copied', {'value': value}),
              style: const TextStyle(color: Colors.white),
            )),
      );
  }

  @override
  Widget build(BuildContext context) {
    final String transactionText = widget.order.client!.phone.isNotEmpty
        ? "${widget.order.client!.phone}-${widget.order.quantity}"
        : "${widget.order.client!.email}-${widget.order.quantity}";
    final String totalText =
        currencyFormatter.format(widget.order.amount.toInt());

    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('order.payment_title')),
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Төлөх дүн — caption + display
            Padding(
              padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
              child: AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tr('order.amount_due_label'), style: AppText.caption),
                    const SizedBox(height: 6.0),
                    Text(
                      "${currencyFormatter.format(widget.order.amount)}₮",
                      style: AppText.display.copyWith(fontSize: 32.0),
                    ),
                  ],
                ),
              ),
            ),
            // Төлбөрийн арга сонгох — pill маягийн segmented TabBar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                padding: const EdgeInsets.all(4.0),
                decoration: BoxDecoration(
                  color: CustomColors.surface,
                  borderRadius: BorderRadius.circular(14.0),
                  border:
                      Border.all(width: 1.0, color: CustomColors.surfaceBorder),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: CustomColors.accent,
                    borderRadius: BorderRadius.circular(10.0),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  indicatorColor: Colors.transparent,
                  dividerColor: Colors.transparent,
                  splashBorderRadius: BorderRadius.circular(10.0),
                  overlayColor:
                      WidgetStateProperty.all(Colors.transparent),
                  labelColor: Colors.black,
                  unselectedLabelColor: CustomColors.textSecondary,
                  labelStyle: const TextStyle(
                      fontFamily: AppText.bold,
                      fontSize: 12.0,
                      fontWeight: FontWeight.bold),
                  unselectedLabelStyle: const TextStyle(
                      fontFamily: AppText.medium,
                      fontSize: 12.0,
                      fontWeight: FontWeight.w500),
                  labelPadding: EdgeInsets.zero,
                  tabs: tabs.map((String tab) {
                    return Container(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        alignment: Alignment.center,
                        child: Text(tab.toUpperCase()));
                  }).toList(),
                ),
              ),
            ),
            Expanded(
              child: TabBarView(controller: _tabController, children: [
                // ------------------------------------------ Банкны апп
                ListView(
                  padding: const EdgeInsets.fromLTRB(16.0, 12.0, 16.0, 32.0),
                  children: [
                    if (widget.makeOrder.links.isNotEmpty)
                      AppCard(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16.0, vertical: 4.0),
                        child: Column(
                          children: List.generate(
                            widget.makeOrder.links.length,
                            (index) {
                              final link = widget.makeOrder.links[index];
                              return Column(
                                children: [
                                  if (index > 0) const AppDivider(vertical: 0),
                                  AppListRow(
                                    title: link.description.isNotEmpty
                                        ? link.description
                                        : link.name,
                                    leading: _BankLogo(url: link.logo),
                                    onTap: () {
                                      final Uri url = Uri.parse(link.deeplink);
                                      launchUrl(url);
                                    },
                                  ),
                                ],
                              );
                            },
                          ),
                        ),
                      ),
                  ],
                ),
                // ------------------------------------------ Шилжүүлэг
                ListView(
                  padding: const EdgeInsets.fromLTRB(16.0, 12.0, 16.0, 32.0),
                  children: [
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _TransferRow(
                            label: tr('order.bank_label'),
                            value: tr('order.khan_bank'),
                          ),
                          const AppDivider(vertical: 10.0),
                          _TransferRow(
                            label: tr('order.account_holder_label'),
                            value: "УАН ГРАММ ГОУЛД СТОНЕ ХХК",
                            onCopy: () => _copy("УАН ГРАММ ГОУЛД СТОНЕ ХХК"),
                          ),
                          const AppDivider(vertical: 10.0),
                          _TransferRow(
                            label: tr('order.account_number_label'),
                            value: "190005005926653395",
                            onCopy: () => _copy("190005005926653395"),
                          ),
                          const AppDivider(vertical: 10.0),
                          _TransferRow(
                            label: tr('order.transaction_note_label'),
                            value: transactionText,
                            onCopy: () => _copy(transactionText),
                          ),
                          const AppDivider(vertical: 10.0),
                          _TransferRow(
                            label: tr('order.total_amount_label'),
                            value: "$totalText₮",
                            valueColor: CustomColors.accent,
                            onCopy: () => _copy(totalText),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ]),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
          child: AppPrimaryButton(
            label: tr('common.ok'),
            onPressed: () {
              Navigator.pop(context);
            },
          ),
        ),
      ),
    );
  }
}

/// Банкны лого — 44px бөөрөнхий tile, зураг ачаалахгүй бол fallback icon
class _BankLogo extends StatelessWidget {
  const _BankLogo({required this.url});
  final String url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12.0),
      child: SizedBox(
        width: 44.0,
        height: 44.0,
        child: url.isEmpty
            ? const AppIconTile(
                size: 44.0,
                child: Icon(Icons.account_balance_outlined,
                    color: Colors.white24, size: 22.0),
              )
            : Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const AppIconTile(
                  size: 44.0,
                  child: Icon(Icons.account_balance_outlined,
                      color: Colors.white24, size: 22.0),
                ),
              ),
      ),
    );
  }
}

/// Шилжүүлгийн мэдээллийн мөр — шошго/утга зүүн, баруун талд "Хуулах" chip
class _TransferRow extends StatelessWidget {
  const _TransferRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.onCopy,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppText.caption),
              const SizedBox(height: 4.0),
              Text(
                value,
                style: AppText.bodyBold
                    .copyWith(color: valueColor ?? Colors.white),
              ),
            ],
          ),
        ),
        if (onCopy != null) ...[
          const SizedBox(width: 12.0),
          InkWell(
            onTap: onCopy,
            borderRadius: BorderRadius.circular(10.0),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10.0, vertical: 6.0),
              decoration: BoxDecoration(
                color: CustomColors.accentSoft,
                borderRadius: BorderRadius.circular(10.0),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.copy_rounded,
                      size: 12.0, color: CustomColors.accent),
                  const SizedBox(width: 4.0),
                  Text(
                    tr('order.copy').toUpperCase(),
                    style: TextStyle(
                      fontFamily: AppText.bold,
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                      color: CustomColors.accent,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
