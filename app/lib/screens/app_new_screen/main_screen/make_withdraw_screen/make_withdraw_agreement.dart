import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:ionicons/ionicons.dart';



class MakeWithdrawAgreement extends StatefulWidget {
  const MakeWithdrawAgreement({super.key});

  @override
  State<MakeWithdrawAgreement> createState() => _MakeWithdrawAgreementState();
}

class _MakeWithdrawAgreementState extends State<MakeWithdrawAgreement> {
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ListView(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(
                        height: 20.0,
                      ),
                      SizedBox(
                        height: 130.0,
                        child: SvgPicture.asset(
                          "assets/icons/agreement-dark.svg",
                        ),
                      ),
                      const SizedBox(
                        height: 10.0,
                      ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    SectionTitle('3. ҮНЭТ ЭДЛЭЛ БИЕТЭЭР АВАХ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ'),

    SectionTitle('1. Нийтлэг үндэслэл'),
    BulletPoint(
      '1.1. Хэрэглэгч захиалсан үнэт эдлэлээ биет хэлбэрээр (“үнэт эдлэл”) авах хүсэлт гаргаж авна.',
    ),
    BulletPoint(
      '1.2. Энэ үйлчилгээг Монгол Улсын “Үнэт металл, үнэт чулууны тухай хууль”-д нийцүүлэн хэрэгжүүлнэ.',
    ),

    SectionTitle('2. Захиалга өгөх журам'),
    BulletPoint(
      '2.1. Биет хэлбэрээр үнэт эдлэл авах хүсэлтийг Аппликейшнээр дамжуулан гаргана.',
    ),
    BulletPoint(
      '2.2. Захиалгын доод хэмжээ 1 грамм байна.',
    ),
    BulletPoint(
      '2.3. Үнэт эдлэлийн хийцлэл, хэлбэр, хэмжээ, сав баглаа боодол нь компанийн санал болгосон стандартын дагуу хийгдэнэ.',
    ),

    SectionTitle('3. Үнэт эдлэл хүлээлгэн өгөх'),
    BulletPoint(
      '3.1. Хэрэглэгч үнэт эдлэлээ компанийн албан ёсны төв дэлгүүрээс болон салбараас биечлэн авна.',
    ),
    SizedBox(
                height: 16.0,
              ),
    Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: Colors.blue.shade900.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Column(
                  children: [
                    Column(
                      children: [
                        Row(
                          children: [
                            Icon(
                              Ionicons.location,
                              color: Colors.blue.shade300,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text("Их Хаадын Чулуу” ХХК-ийн салбар:", style: TextStyle(
                              color: Colors.blue.shade300,
                              fontSize: 14.0,
                            ),),
                          ],
                        ),
                        Text(
                          'a. Төв дэлгүүр – ХУД, 15-р хороо, Махатма Гандийн гудамж, One Center 10 тоот',
                          style: TextStyle(
                            color: Colors.blue.shade300,
                            fontSize: 14.0,
                          ),
                        ),
                        Text(
                          'b. Эрдэнэт салбар – Орхон аймаг, Эрдэнэт хот, Гок гарден хотхон',
                          style: TextStyle(
                            color: Colors.blue.shade300,
                            fontSize: 14.0,
                          ),
                        ),


                      ],
                    ),
                    SizedBox(
                      height: 8.0,
                    ),
                    Row(
                      children: [
                        Icon(
                          Ionicons.call,
                          color: Colors.blue.shade300,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '7588-8888',
                            style: TextStyle(
                              color: Colors.blue.shade300,
                              fontSize: 14.0,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(
                      height: 16.0,
                    ),
                    Row(
                      children: [
                        Icon(
                          Ionicons.alarm,
                          color: Colors.blue.shade300,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '10:00 - 18:00',
                            style: TextStyle(
                              color: Colors.blue.shade300,
                              fontSize: 14.0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 16.0,
              ),
    BulletPoint(
      '3.2. Үнэт эдлэл хүлээж авахдаа иргэний үнэмлэхээрээ Хэрэглэгч өөрийгөө баталгаажуулна.',
    ),
    BulletPoint(
      '3.3. Хэрэглэгч өөрийн биеэр үнэт эдлэлээ биетээр авах боломжгүй тохиолдолд нотариатаар баталгаажуулсан итгэмжлэлийг үндэслэн олгоно.',
    ),
    BulletPoint(
      '3.4. Компани Хэрэглэгчид үнэт эдлэлийг зөвхөн биетээр олгохдоо НӨАТ-ын баримтыг олгоно.',
    ),
    BulletPoint(
      '3.5. Үнэт эдлэлийг Хэрэглэгчид зөвхөн ажлын өдөр, ажлын цагаар олгоно.',
    ),

    SectionTitle('4. Компанийн эрх, үүрэг'),
    BulletPoint(
      '4.1. Үнэт эдлэлийг сорьцын улсын баталгаажуулалттайгаар олгох үүрэгтэй.',
    ),
    BulletPoint(
      '4.2. Хэрэглэгчийн захиалгыг 24-48 хугацаанд биелүүлэх үүрэгтэй.',
    ),
    BulletPoint(
      '4.3. Байгалийн гамшиг, гэнэтийн нөхцөлөөс үүдэн хойшилсон тохиолдолд хэрэглэгчид урьдчилан мэдэгдэнэ.',
    ),
  ],
)
,
                        
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String text;
  SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: 16.0, bottom: 8.0),
      child: Text(
        text,
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class SubSectionTitle extends StatelessWidget {
  final String text;
  SubSectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: 12.0, bottom: 6.0),
      child: Text(
        text,
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class SectionText extends StatelessWidget {
  final String text;
  SectionText(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: TextStyle(fontSize: 14),
      ),
    );
  }
}

class BulletPoint extends StatelessWidget {
  final String text;
  BulletPoint(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16.0, bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(fontSize: 14)),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}