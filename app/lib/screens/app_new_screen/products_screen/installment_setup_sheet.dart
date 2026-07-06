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
    final totalDays = totalDaysFor(_months);
    final daily = dailyAmount(p.price, _months);

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
                    label: 'Сонгосон хугацаа',
                    value: '$_months сар ($totalDays өдөр)',
                  ),
                  const Divider(
                    height: 18,
                    color: Colors.white12,
                  ),
                  _Row(
                    label: 'Өдөр бүр',
                    value: formatMNT(daily),
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

Энэхүү нөхцөл нь "ИХ ХААДЫН ЧУЛУУ" ХХК ("Компани")-ийн аппликейшнаар дамжуулан үзүүлэх хуваан төлөх үйлчилгээг авахтай холбоотойгоор Компани, Хэрэглэгч хоёрын эрх, үүрэг, хариуцлагыг зохицуулна.

1. ҮЙЛЧИЛГЭЭНИЙ МӨН ЧАНАР
1.1. Хэрэглэгч сонгосон барааны нийт үнийг 1–12 сар (1 сар = 30 хоног) хүртэлх хугацаанд өдөрт ногдох тэнцүү дүнд хуваан тооцно. Жишээ нь: 6 сар сонгосон бол нийт үнэ 180 хоногт хуваагдаж, өдрийн төлбөрийн дүн тодорхойлогдоно.
1.2. Өдрийн төлбөрийн дүн нь "нийт үнэ ÷ нийт хоног" томьёогоор тооцогдоно.

2. ГЭРЭЭ ҮҮСЭХ
2.1. Худалдан авалт нь зөвхөн ЭХНИЙ ӨДРИЙН ТӨЛБӨР амжилттай төлөгдсөн үед системд бүртгэгдэж, талуудын эрх, үүрэг үүснэ. Үүнээс өмнө аливаа үүрэг хариуцлага үүсэхгүй.

3. ТӨЛБӨР
3.1. Хэрэглэгч төлбөрөө аппликейшнд нэвтэрч өөрөө хийх бөгөөд төлбөр амжилттай хийгдсэн эсэхийг аппликейшн дотроос шалгаж болно.
3.2. Төлбөрийг заавал өдөр бүр хийх албагүй. Хэрэглэгч өөрийн санхүүгийн боломжид тохируулан дуртай үедээ, хэдэн ч удаа төлбөрөө хийж болно. Гэхдээ өдөр бүр тогтмол төлснөөр нэг удаагийн төлбөрийн дүн бага байж, санхүүгийн дарамтгүй байх давуу талтай.
3.3. Хэрэглэгч хуваан төлөлтөө тогтмол хийж байх үүрэгтэй. Дараалсан 10 (арав) хоногийн турш ямар нэгэн төлбөр хийгээгүй тохиолдолд төлөлт цуцлагдах эрсдэлтэй (4.3, 4.4-р зүйлийг үзнэ үү).
3.4. Барааны үнэ нь худалдан авалт эхэлсэн өдрийн үнээр тогтоогдох ба төлөлтийн туршид өөрчлөгдөхгүй. Дараа нь барааны үнэ өөрчлөгдсөн нь идэвхтэй төлөлтөд нөлөөлөхгүй.

4. ХУГАЦАА БА ТӨЛБӨРИЙН ҮҮРЭГ
4.1. Хэрэглэгч сонгосон нийт хугацаа ("дуусах хугацаа") дуусахаас өмнө барааны нийт үнийг бүрэн төлж дуусгасан байх үүрэгтэй.
4.2. Дуусах хугацаа дууссанаас хойш ажлын 3 хоногийн дотор төлбөрөө бүрэн төлж дуусгаагүй тохиолдолд гэрээ цуцлагдана. Энэ үед тухайн бараанд заасан цуцлах шимтгэлийг төлсөн нийт дүнгээс хасаж, үлдсэн дүнг Хэрэглэгчийн дансанд буцаан олгоно.
4.3. Хэрэглэгч хуваан төлөлтөө тогтмол хийх үүрэгтэй. Дараалсан 5 (тав) хоногийн турш ямар нэгэн төлбөр хийгээгүй тохиолдолд Хэрэглэгч аппликейшн болон мэдэгдлээр анхааруулга хүлээн авна.
4.4. Хэрэглэгч дараалсан 10 (арав) хоногийн турш ямар нэгэн төлбөр хийгээгүй тохиолдолд Компани тухайн хуваан төлөлтийг цуцлах эрхтэй. Цуцлагдсан тохиолдолд тухайн бараанд заасан цуцлах шимтгэлийг төлсөн нийт дүнгээс хасаж, үлдсэн дүнг Хэрэглэгчийн дансанд буцаан олгоно.

5. БАРАА ГАРДУУЛАЛТ
5.1. Бараа нь БҮХ ТӨЛБӨР БҮРЭН ТӨЛӨГДСӨНИЙ дараа олгогдоно.
5.2. Төлбөр бүрэн дуусахад системээс 6 оронтой авах код үүснэ. Хэрэглэгч уг кодыг "Их хаадын чулуу" төв салбарт өөрийн биеэр, иргэний үнэмлэхний хамт ирж үзүүлснээр бараагаа гардан авна.
5.3. Төлбөр бүрэн төлөгдөөгүй тохиолдолд бараа олгогдохгүй.

6. ЦУЦЛАЛТ БА БУЦААН ОЛГОЛТ
6.1. Хэрэглэгч төлөлтөө хүссэн үедээ цуцлах эрхтэй.
6.2. Цуцлах тохиолдолд тухайн бараанд заасан цуцлах шимтгэлийн хувийг төлсөн нийт дүнгээс хасаж, үлдэгдлийг ажлын 7 хоногийн дотор Хэрэглэгчийн дансанд буцаан олгоно. Цуцлах шимтгэлийн хэмжээ нь барааны дэлгэрэнгүй хэсэгт тодорхой заасан байна.

7. БУСАД НӨХЦӨЛ
7.1. Хэрэглэгч нэгэн зэрэг ЗӨВХӨН НЭГ идэвхтэй хуваан төлөлттэй байж болно. Шинэ худалдан авалт хийхээс өмнө одоогийн төлөлтөө бүрэн дуусгах эсвэл цуцлах шаардлагатай.
7.2. Хэрэглэгч өөрийн оруулсан мэдээллийн үнэн зөвийг бүрэн хариуцна. Компани нь залилан, хуурамч мэдээлэл, зүй бус үйлдэл илэрсэн тохиолдолд холбогдох худалдан авалтыг цуцлах, цаашид үйлчилгээ үзүүлэхээс татгалзах эрхтэй.
7.3. Хэрэглэгчийн хувийн болон санхүүгийн мэдээллийг зөвхөн үйлчилгээ үзүүлэх, төлбөр тооцоо хийх зорилгоор ашиглах ба нууцлалыг хадгална.
7.4. Бараатай холбоотой чанарын асуудлыг гардан авсны дараа Монгол Улсын холбогдох хууль тогтоомжийн дагуу шийдвэрлэнэ.

8. НӨХЦӨЛИЙН ӨӨРЧЛӨЛТ БА ЗӨВШӨӨРӨЛ
8.1. Энэхүү нөхцөл нь үйлчилгээний шинэчлэлтэй уялдан өөрчлөгдөж болох ба, өөрчлөгдсөн нөхцөл нь хүчин төгөлдөр болсон өдрөөс хойшхи шинэ худалдан авалтад үйлчилнэ. Аль хэдийн эхэлсэн төлөлтөд эхлэх үеийн нөхцөл хадгална.
8.2. "Зөвшөөрч байна" гэснээр Хэрэглэгч энэхүү нөхцөлийг бүрэн уншиж, ойлгож, хүлээн зөвшөөрсөнд тооцогдоно.
''';
