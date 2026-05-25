import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';



class OrderAgreement extends StatefulWidget {
  const OrderAgreement({super.key});

  @override
  State<OrderAgreement> createState() => _OrderAgreementState();
}

class _OrderAgreementState extends State<OrderAgreement> {
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
                      ),Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    SectionTitle('АППЛИКЕЙШНИЙ ЕРӨНХИЙ ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ'),

    SectionTitle('1. Нийтлэг үндэслэл'),
    BulletPoint(
        '1.1. Энэхүү нөхцөл нь “ИХ ХААДЫН ЧУЛУУ” ХХК-ийн (“Компани”) гар утасны аппликейшн (“Аппликейшн”)-ы үйлчилгээг авахтай (“Үйлчилгээ”-д үнэт эдлэл захиалах, үнэт эдлэл биетээр авах, үнэт эдлэлээ бусдад бэлэглэх зэрэг хамаарна) холбоотой хэрэглэгч (“Хэрэглэгч”)-ийн эрх, үүрэг, хариуцлагыг зохицуулна.'),
    BulletPoint(
        '1.2. Хэрэглэгч Аппликейшний үйлчилгээний нөхцөлийг зөвшөөрснөөр Монгол Улсын Иргэний хууль, Хувь хүний нууцын тухай хууль болон бусад холбогдох хууль тогтоомжийг дагаж мөрдөх үүрэгтэй.'),
    BulletPoint(
        '1.3. Үнэт эдлэлийн түүхий эд буюу үнэт металлын ханш нь Компанийн хяналтаас гадуур хүчин зүйл тул ханшийн хэлбэлзлийг “Эрсдэл” гэж авч үзэх бөгөөд Компани үүнд хариуцлага хүлээхгүй болно.'),

    SectionTitle('2. Бүртгэл, мэдээлэл'),
    BulletPoint(
        '2.1. Хэрэглэгч Аппликейшнээр үйлчилгээг ашиглахын тулд өөрийн нэр, регистрийн дугаар, гар утасны дугаар, имэйл зэрэг хувийн мэдээллээ үнэн зөв оруулах үүрэгтэй.'),
    BulletPoint(
        '2.2. Хэрэглэгчийн Компанид гаргаж өгсөн мэдээлэл худал, хуурамч байх тохиолдолд Компани үйлчилгээ үзүүлэхээс татгалзах, захиалгыг цуцлах, зохих эрх бүхий байгууллагад мэдээллэх эрхтэй.'),
    BulletPoint(
        '2.3. Аппликейшний зайлшгүй шаардлагатай шинэчлэлт, сайжруулахдаа Компани хэрэглэгчид урьдчилан мэдээллэх бөгөөд, энэ хугацаанд Компани Аппликейшнаар дамжуулан Үйлчилгээ түр саатах тохиолдолд Хэрэглэгч хэрэглээгээ урьдчилан зохицуулна.'),

    SectionTitle('3. Нууцлал ба мэдээллийн хамгаалалт'),
    BulletPoint(
        '3.1. Компани нь Хэрэглэгчийн хувийн болон санхүүгийн мэдээллийг зөвхөн үйлчилгээг хүргэх зорилгоор ашиглана.'),
    BulletPoint(
        '3.2. Хэрэглэгчийн зөвшөөрөлгүйгээр мэдээллийг гуравдагч этгээдэд дамжуулахгүй, Монгол Улсын “Хувь хүний мэдээлэл хамгаалах тухай хууль”-д нийцүүлнэ.'),
    BulletPoint(
        '3.3. Нууц үг, баталгаажуулах кодыг Хэрэглэгч өөрөө хамгаалах үүрэгтэй бөгөөд санаатай болон болгоомжгүйгээр гуравдагч этгээдэд задруулснаас үүдэн гарсан аливаа хохирлыг Хэрэглэгч хариуцна.'),

    SectionTitle('4. Хэрэглэгчийн үүрэг'),
    BulletPoint(
        '4.1. Аппликейшнийг Мөнгө угаах, терроризмыг санхүүжүүлэхтэй тэмцэх тухай хууль-д заасны дагуу хууль бус зорилгоор ашиглахгүй байх.'),
    BulletPoint('4.2. Бусдын мэдээллийг зөвшөөрөлгүй ашиглахгүй байх.'),
    BulletPoint('4.3. Хуурамч, залилангийн шинжтэй үйлдэл хийхгүй байх.'),

    SectionTitle('5. Компанийн эрх, үүрэг'),
    BulletPoint(
        '5.1. Хэрэглэгч нөхцөлийг удаа дараа зөрчсөн тохиолдолд үйлчилгээг түр зогсоох, шаардлагатай бол хууль хяналтын байгууллагад мэдэгдэх эрхтэй.'),
    BulletPoint(
        '5.2. Үйлчилгээний нөхцөлд өөрчлөлт оруулах ба энэ талаар Хэрэглэгчид аппликейшнээр дамжуулан мэдэгдэнэ.'),

    SectionTitle('6. Бусад нөхцөл'),
    BulletPoint(
        '6.1. Өв залгамжлуулах бол Монгол Улсын Иргэний Хуулийн 56-р бүлэгт заасны дагуу өвлөгч нь нотариатаас “Өв залгамжлах эрхийн гэрчилгээ”-г авч өөрийн биеэр Компанид ирж өвийг шилжүүлэн авна.'),
    BulletPoint(
        '6.2. Компани хуулиар хүлээсэн үүргийн дагуу Хэрэглэгчийн мэдээллийг тогтмол шинэчлэх шаардлагатай байдаг тул Овог, Нэр, Регистрийн дугаар, Цахим шуудангийн хаяг, Гар утасны дугаар болон холбогдох бусад мэдээлэл тань өөрчлөгдөх эсвэл Компанийн зүгээс шаардсан тухай бүр мэдээллийг шинэчлэх ёстой.'),
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