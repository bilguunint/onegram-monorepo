import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';



class SendGiftAgreement extends StatefulWidget {
  const SendGiftAgreement({super.key});

  @override
  State<SendGiftAgreement> createState() => _SendGiftAgreementState();
}

class _SendGiftAgreementState extends State<SendGiftAgreement> {
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
    SectionTitle('2. ҮНЭТ ЭДЛЭЛ БЭЛЭГЛЭХ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ'),

    SectionTitle('1. Үндсэн ойлголт'),
    BulletPoint(
      '1.1. “Үнэт эдлэл бэлэглэх үйлчилгээ” нь Хэрэглэгч өөрийн захиалсан үнэт эдлэл тодорхой хэмжээг бусад бүртгэлтэй хэрэглэгчид шилжүүлэх боломжийг олгоно.',
    ),
    BulletPoint(
      '1.2. Энэ үйлчилгээ нь Монгол Улсын Иргэний хуульд заасан “бэлэглэх гэрээ”-ний зарчмыг дагана.',
    ),

    SectionTitle('2. Үйлчилгээний журам'),
    BulletPoint(
      '2.1. Үнэт эдлэл бэлэглэх үйлчилгээ нь зөвхөн Аппликейшнд бүртгэлтэй хэрэглэгчийн бүртгэл хооронд хийгдэнэ.',
    ),
    BulletPoint(
      '2.2. Хэрэглэгчид үнэт эдлэл бэлэглэх эрх нь өдөрт 1 удаа 1гр байна.',
    ),
    BulletPoint(
      '2.3. Үнэт эдлэл бэлэглэх үйлчилгээг баталгаажуулахдаа код ашиглана.',
    ),

    SectionTitle('3. Хэрэглэгчийн хариуцлага'),
    BulletPoint(
      '3.1. Үнэт эдлэл бэлгэлсэн бэлгийг бэлэг хүлээн авагч хүлээн авсан тохиолдолд буцаах боломжгүй.',
    ),
    BulletPoint(
      '3.2. Бусдад санаатай болон болгоомжгүйгээр андууран бэлэглэсэн тохиолдолд Хэрэглэгч бүрэн хариуцна.',
    ),
    BulletPoint(
      '3.3. Хуурамч, хууль бус зорилгоор үнэт эдлэл бэлэглэсэн нь тогтоогдвол Компани Хэрэглэгчид үйлчилгээ үзүүлэхээ зогсоох эрхтэй.',
    ),

    SectionTitle('4. Компанийн эрх, үүрэг'),
    BulletPoint(
      '4.1. Монгол Улсын татварын болон санхүүгийн хууль тогтоомжид нийцүүлэн бүртгэж, тайлагнана.',
    ),
    BulletPoint(
      '4.2. Мэдээллийн аюулгүй байдлыг хангах техникийн арга хэмжээ авна.',
    ),
  ],
)

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