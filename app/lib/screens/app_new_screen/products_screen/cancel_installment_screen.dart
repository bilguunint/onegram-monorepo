import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Mongolian banks the refund can be transferred to.
const List<String> kMongolianBanks = [
  'Хаан банк',
  'Голомт банк',
  'Худалдаа хөгжлийн банк',
  'Төрийн банк',
  'Хас банк',
  'М банк',
  'Капитрон банк',
  'Ариг банк',
  'Богд банк',
  'Чингис Хаан банк',
  'Үндэсний хөрөнгө оруулалтын банк',
];

/// User-initiated installment cancellation. Shows the refund breakdown
/// (paid − cancel fee) and collects the bank account the refund should be
/// transferred to, then files an `installment_cancel_requests` doc for admin
/// review via the backend.
class CancelInstallmentScreen extends StatefulWidget {
  final ProductPurchase purchase;
  const CancelInstallmentScreen({super.key, required this.purchase});

  @override
  State<CancelInstallmentScreen> createState() =>
      _CancelInstallmentScreenState();
}

class _CancelInstallmentScreenState extends State<CancelInstallmentScreen> {
  final ProductRepository _repo = ProductRepository();
  final _accountCtrl = TextEditingController();
  final _holderCtrl = TextEditingController();
  String? _bank;
  bool _termsAccepted = false;
  bool _submitting = false;

  @override
  void dispose() {
    _accountCtrl.dispose();
    _holderCtrl.dispose();
    super.dispose();
  }

  int get _paid => widget.purchase.paidAmount;
  int get _feePercent => widget.purchase.productSnapshot.cancelFeePercent;
  int get _fee => ((_paid * _feePercent) / 100).round();
  int get _refund => (_paid - _fee).clamp(0, _paid);

  Future<void> _submit() async {
    final account = _accountCtrl.text.trim();
    final holder = _holderCtrl.text.trim();
    if (_bank == null) {
      _toast(tr('product.select_bank_error'));
      return;
    }
    if (!RegExp(r'^\d{5,20}$').hasMatch(account)) {
      _toast(tr('product.invalid_account'));
      return;
    }
    if (holder.length < 2) {
      _toast(tr('product.enter_holder_name'));
      return;
    }
    if (!_termsAccepted) {
      _toast(tr('product.accept_refund_terms'));
      return;
    }

    setState(() => _submitting = true);
    try {
      await _repo.requestInstallmentCancel(
        purchaseId: widget.purchase.id,
        bankName: _bank!,
        accountNumber: account,
        accountHolder: holder,
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) => AppDialog(
          icon: Icons.check_rounded,
          iconColor: CustomColors.positive,
          title: tr('product.request_sent'),
          message: tr('product.cancel_request_sent_body',
              {'amount': formatMNT(_refund)}),
          primaryLabel: tr('product.got_it'),
          onPrimary: () => Navigator.of(dialogCtx).pop(),
        ),
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      _toast(e.toString().replaceFirst('Bad state: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: CustomColors.negative),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('product.cancel_installment')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          _infoNote(),
          const SizedBox(height: 12),
          _refundCard(),
          const SizedBox(height: 12),
          _bankForm(),
          const SizedBox(height: 12),
          _termsSection(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: AppPrimaryButton(
            label: tr('common.confirm'),
            danger: true,
            loading: _submitting,
            onPressed: _submitting ? null : _submit,
          ),
        ),
      ),
    );
  }

  Widget _refundCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.purchase.productSnapshot.name,
              style: AppText.sectionTitle),
          const SizedBox(height: 8),
          AppInfoRow(label: tr('product.total_paid'), value: formatMNT(_paid)),
          AppInfoRow(
            label: tr('product.cancel_fee_percent', {'percent': _feePercent}),
            value: '−${formatMNT(_fee)}',
            valueColor: CustomColors.negative,
          ),
          const AppDivider(vertical: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(tr('product.refund_amount'), style: AppText.bodyBold),
              Text(
                formatMNT(_refund),
                style: AppText.displayUnit.copyWith(
                    color: CustomColors.positive, fontSize: 20),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _bankForm() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('product.refund_account'), style: AppText.sectionTitle),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _bank,
            dropdownColor: CustomColors.surfaceAlt,
            style: AppText.body,
            icon: Icon(Icons.keyboard_arrow_down_rounded,
                color: CustomColors.textSecondary),
            decoration: appInputDecoration(hint: tr('product.select_bank')),
            items: kMongolianBanks
                .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                .toList(),
            onChanged: (v) => setState(() => _bank = v),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _accountCtrl,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: AppText.body,
            cursorColor: CustomColors.accent,
            decoration: appInputDecoration(hint: tr('product.account_number')),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _holderCtrl,
            textCapitalization: TextCapitalization.words,
            style: AppText.body,
            cursorColor: CustomColors.accent,
            decoration: appInputDecoration(hint: tr('product.account_holder')),
          ),
        ],
      ),
    );
  }

  String get _termsText => tr('product.refund_terms', {'percent': _feePercent});

  Widget _termsSection() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('product.refund_terms_title'), style: AppText.sectionTitle),
          const SizedBox(height: 10),
          Container(
            constraints: const BoxConstraints(maxHeight: 160),
            decoration: BoxDecoration(
              color: CustomColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CustomColors.surfaceBorder),
            ),
            padding: const EdgeInsets.all(12),
            child: Scrollbar(
              child: SingleChildScrollView(
                child: Text(
                  _termsText,
                  style: AppText.caption.copyWith(height: 1.5),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          InkWell(
            onTap: () => setState(() => _termsAccepted = !_termsAccepted),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: _termsAccepted
                          ? CustomColors.accent
                          : Colors.transparent,
                      border: Border.all(
                        color: _termsAccepted
                            ? CustomColors.accent
                            : CustomColors.textTertiary,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: _termsAccepted
                        ? const Icon(Icons.check_rounded,
                            size: 14, color: Colors.black)
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      tr('product.accept_terms_checkbox'),
                      style: AppText.body.copyWith(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoNote() {
    return AppBanner(
      color: CustomColors.negative,
      icon: Icons.warning_amber_rounded,
      text: tr('product.cancel_info_note'),
    );
  }
}
