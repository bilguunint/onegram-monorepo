import 'package:flutter/material.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/product_format.dart';
import 'package:onegrgold/style/colors.dart';

/// Bottom sheet that lets the user pick how many months to split the payment
/// over (between [Product.minMonths] and [Product.maxMonths]).
///
/// Returns the chosen month count on confirm, or null on cancel.
class InstallmentSetupSheet extends StatefulWidget {
  final Product product;

  const InstallmentSetupSheet({super.key, required this.product});

  @override
  State<InstallmentSetupSheet> createState() => _InstallmentSetupSheetState();
}

class _InstallmentSetupSheetState extends State<InstallmentSetupSheet> {
  late int _months;
  bool _termsAccepted = false;

  @override
  void initState() {
    super.initState();
    _months = widget.product.maxMonths.clamp(1, 12);
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final minM = p.minMonths.clamp(1, 12);
    final maxM = p.maxMonths.clamp(1, 12);
    final monthly = monthlyAmount(p.price, _months);

    return SafeArea(
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1B1B1E),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.fromLTRB(
          18,
          12,
          18,
          MediaQuery.of(context).viewInsets.bottom + 18,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Хуваан төлөх төлөвлөгөө',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              p.name,
              style: const TextStyle(color: Colors.white54, fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 18),

            // Summary
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  _Row(
                    label: 'Нийт үнэ',
                    value: formatMNT(p.price),
                  ),
                  const SizedBox(height: 6),
                  _Row(
                    label: 'Сонгосон сар',
                    value: '$_months сар',
                  ),
                  const Divider(
                    height: 18,
                    color: Colors.white12,
                  ),
                  _Row(
                    label: 'Сар бүрд',
                    value: formatMNT(monthly),
                    emphasised: true,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),
            const Text(
              'Сар сонгох',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 8),
            _MonthChips(
              min: minM,
              max: maxM,
              selected: _months,
              onChanged: (m) => setState(() => _months = m),
            ),

            const SizedBox(height: 16),

            // Terms of service
            const Text(
              'Үйлчилгээний нөхцөл',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 160),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              padding: const EdgeInsets.all(10),
              child: const Scrollbar(
                child: SingleChildScrollView(
                  child: Text(
                    _termsText,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      height: 1.5,
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 10),
            // Acceptance checkbox
            InkWell(
              onTap: () =>
                  setState(() => _termsAccepted = !_termsAccepted),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
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
                          ? Icon(
                              Icons.check,
                              size: 14,
                              color: CustomColors.mainBlack,
                            )
                          : null,
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Би үйлчилгээний нөхцөлийг бүрэн уншиж танилцлаа, зөвшөөрч байна.',
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

            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(null),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withOpacity(0.25)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Болих'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _termsAccepted
                        ? () => Navigator.of(context).pop(_months)
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CustomColors.mainColor,
                      foregroundColor: CustomColors.mainBlack,
                      disabledBackgroundColor:
                          CustomColors.mainColor.withOpacity(0.25),
                      disabledForegroundColor: Colors.white54,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    child: const Text('Баталгаажуулах'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final bool emphasised;

  const _Row({
    required this.label,
    required this.value,
    this.emphasised = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: emphasised ? CustomColors.mainColor : Colors.white,
            fontSize: emphasised ? 16 : 13,
            fontWeight:
                emphasised ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _MonthChips extends StatelessWidget {
  final int min;
  final int max;
  final int selected;
  final ValueChanged<int> onChanged;

  const _MonthChips({
    required this.min,
    required this.max,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final options = [for (var i = min; i <= max; i++) i];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((m) {
        final active = m == selected;
        return GestureDetector(
          onTap: () => onChanged(m),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: active
                  ? CustomColors.mainColor
                  : Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: active
                    ? CustomColors.mainColor
                    : Colors.white.withOpacity(0.12),
              ),
            ),
            child: Text(
              '$m сар',
              style: TextStyle(
                color: active ? CustomColors.mainBlack : Colors.white,
                fontWeight: active ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

const String _termsText = '''
ХУВААН ТӨЛӨХ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ

1. Энэхүү үйлчилгээгээр Худалдан авагч нь сонгосон барааны нийт үнийг 1-12 сар хүртэлх тогтсон хугацаанд тэнцүү хувааж төлнө.

2. Худалдан авалт нь ЭХНИЙ САРЫН ТӨЛБӨР АМЖИЛТТАЙ ТӨЛӨГДСӨН цагт системд бүртгэгдэнэ. Энэ хүртэл аливаа үүрэг, эрх үүсэхгүй.

3. Сар бүрийн төлбөрийг QPay системээр төлнө. Хэрэв тогтсон огноо хэтэрвэл систем сануулга илгээх ба гэрээ автоматаар цуцлагдах эрсдэлтэй.

4. Бараа нь БҮХ САРЫН ТӨЛБӨР БҮРЭН ТӨЛӨГДСӨНИЙ ДАРАА хүлээлгэн өгөгдөнө. Өмнө нь бараа авах боломжгүй.

5. Хэрэглэгч хүссэн үедээ цуцлах эрхтэй. Цуцлах тохиолдолд тухайн бараа дээр заасан "цуцлах шимтгэл"-ийн хувийг төлсөн нийт дүнгээс хасч үлдсэн хэсгийг 7 хоногийн дотор буцаан олгоно.

6. Худалдан авагч нэгэн зэрэг ЗӨВХӨН НЭГ идэвхтэй хуваан төлөлттэй байна. Шинэ худалдан авалт хийхээс өмнө одоогийн төлөлтөө бүрэн дуусгах эсвэл цуцлах хэрэгтэй.

7. Барааны үнэ нь худалдан авалт эхэлсэн өдрөөс хүчин төгөлдөр бөгөөд төлөлтийн явцад үнэ өөрчлөгдөхгүй.

8. Худалдан авагч өөрийн оруулсан мэдээллийн үнэн зөвийг хариуцна. Системээс илрүүлсэн залилан, хууран мэхлэх оролдлоготой худалдан авалтыг цуцлах эрхтэй.

9. Барааны чанартай холбоотой асуудлыг хүлээлгэн өгсний дараа холбогдох хууль тогтоомжийн дагуу шийдвэрлэнэ.

10. Энэхүү нөхцөл нь системийн шинэчлэлтэй уялдан өөрчлөгдөж болох ба, өөрчлөгдсөн нөхцөл нь шинэ худалдан авалтад үйлчилнэ.
''';
