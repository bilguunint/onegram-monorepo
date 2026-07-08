import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/product_purchase_model.dart';
import 'package:onegrgold/repositories/product_repository.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
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
      _toast('Банкаа сонгоно уу.');
      return;
    }
    if (!RegExp(r'^\d{5,20}$').hasMatch(account)) {
      _toast('Дансны дугаараа зөв оруулна уу (зөвхөн тоо).');
      return;
    }
    if (holder.length < 2) {
      _toast('Хүлээн авагчийн нэрээ оруулна уу.');
      return;
    }
    if (!_termsAccepted) {
      _toast('Буцаан олголтын нөхцөлийг хүлээн зөвшөөрнө үү.');
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
        builder: (dialogCtx) => AlertDialog(
          backgroundColor: const Color(0xFF1F1F22),
          title: Row(
            children: [
              Icon(Icons.check_circle, color: CustomColors.successGreen),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Хүсэлт илгээгдлээ',
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
            ],
          ),
          content: Text(
            'Таны цуцлах хүсэлтийг админ шалгаж баталгаажуулсны дараа '
            '${formatMNT(_refund)} ажлын 5 хоногийн дотор таны данс руу '
            'шилжинэ.',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child:
                  Text('За', style: TextStyle(color: CustomColors.mainColor)),
            ),
          ],
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
      SnackBar(content: Text(msg), backgroundColor: CustomColors.alerRed),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Хуваан төлөлт цуцлах',
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
                _refundCard(),
                const SizedBox(height: 14),
                _bankForm(),
                const SizedBox(height: 14),
                _termsSection(),
                const SizedBox(height: 14),
                _infoNote(),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: MainButton(
                isLoading: _submitting,
                onPress: _submitting ? null : _submit,
                title: const Text(
                  'Баталгаажуулах',
                  style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _refundCard() {
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
          Text(
            widget.purchase.productSnapshot.name,
            style: const TextStyle(
                color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          _row('Нийт төлсөн дүн', formatMNT(_paid), Colors.white),
          const SizedBox(height: 8),
          _row('Цуцлалтын шимтгэл ($_feePercent%)', '−${formatMNT(_fee)}',
              const Color(0xFFE57373)),
          const Divider(color: Colors.white12, height: 22),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Буцаан олгох дүн',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
              Text(
                formatMNT(_refund),
                style: TextStyle(
                  color: CustomColors.mainColor,
                  fontFamily: 'RubikBold',
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
        Text(value,
            style: TextStyle(
                color: valueColor, fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _bankForm() {
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
          const Text(
            'Буцаан олголт хүлээн авах данс',
            style: TextStyle(
                color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _bank,
            dropdownColor: const Color(0xFF252528),
            style: const TextStyle(color: Colors.white, fontSize: 13),
            icon: Icon(Icons.keyboard_arrow_down_rounded,
                color: CustomColors.mainColor),
            decoration: _inputDecoration('Банк сонгох'),
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
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: _inputDecoration('Дансны дугаар'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _holderCtrl,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: _inputDecoration('Хүлээн авагчийн нэр'),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white30, fontSize: 12.5),
      filled: true,
      fillColor: Colors.white.withOpacity(0.05),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide.none,
      ),
    );
  }

  String get _termsText => '''
1. Хуваан төлөлтийг цуцлахад нийт төлсөн дүнгээс цуцлалтын шимтгэл ($_feePercent%) суутгагдана.

2. Буцаан олгох дүнг цуцлах хүсэлтийг админ шалгаж баталгаажуулснаас хойш АЖЛЫН 5 ХОНОГИЙН ДОТОР таны заасан банкны данс руу шилжүүлнэ.

3. Банк, дансны дугаар, хүлээн авагчийн нэрийг үнэн зөв оруулах нь хэрэглэгчийн хариуцлага бөгөөд буруу мэдээллээс үүдэх хойшлолт, алдааг Компани хариуцахгүй.

4. Цуцлах хүсэлт хүлээгдэж байх хугацаанд тухайн хуваан төлөлтөд шинэ төлбөр хийх боломжгүй.

5. Цуцлалт баталгаажсаны дараа худалдан авалт сэргээгдэхгүй бөгөөд төлсөн өдрүүд шинэ худалдан авалтад шилжихгүй.

6. Буцаан олголт нь зөвхөн хэрэглэгчийн заасан данс руу нэг удаа хийгдэнэ.''';

  Widget _termsSection() {
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
          const Text(
            'Буцаан олголтын нөхцөл',
            style: TextStyle(
                color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          Container(
            constraints: const BoxConstraints(maxHeight: 160),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            padding: const EdgeInsets.all(10),
            child: Scrollbar(
              child: SingleChildScrollView(
                child: Text(
                  _termsText,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    height: 1.5,
                  ),
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
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: _termsAccepted
                          ? CustomColors.mainColor
                          : Colors.transparent,
                      border: Border.all(
                        color: _termsAccepted
                            ? CustomColors.mainColor
                            : Colors.white38,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: _termsAccepted
                        ? Icon(Icons.check,
                            size: 14, color: CustomColors.mainBlack)
                        : null,
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Би мөнгөн буцаан олголтын дээрх нөхцөлүүдийг бүрэн '
                      'уншиж танилцаж, хүлээн зөвшөөрч байна.',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        height: 1.35,
                      ),
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
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.amber.withOpacity(0.25)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 14, color: Colors.amberAccent),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Хүсэлтийг админ шалгаж баталгаажуулсны дараа хуваан төлөлт '
              'цуцлагдаж, буцаан олгох дүн ажлын 5 хоногийн дотор дээрх данс '
              'руу шилжинэ. Хүсэлт хүлээгдэж байх хооронд төлбөр хийх '
              'боломжгүй.',
              style:
                  TextStyle(color: Colors.white70, fontSize: 11, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
