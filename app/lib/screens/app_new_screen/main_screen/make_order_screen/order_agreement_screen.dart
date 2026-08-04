import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:onegrgold/l10n/app_locale.dart';



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
    SectionTitle(tr('order.terms_title')),

    SectionTitle(tr('order.terms_s1_title')),
    BulletPoint(tr('order.terms_1_1')),
    BulletPoint(tr('order.terms_1_2')),
    BulletPoint(tr('order.terms_1_3')),

    SectionTitle(tr('order.terms_s2_title')),
    BulletPoint(tr('order.terms_2_1')),
    BulletPoint(tr('order.terms_2_2')),
    BulletPoint(tr('order.terms_2_3')),

    SectionTitle(tr('order.terms_s3_title')),
    BulletPoint(tr('order.terms_3_1')),
    BulletPoint(tr('order.terms_3_2')),
    BulletPoint(tr('order.terms_3_3')),

    SectionTitle(tr('order.terms_s4_title')),
    BulletPoint(tr('order.terms_4_1')),
    BulletPoint(tr('order.terms_4_2')),
    BulletPoint(tr('order.terms_4_3')),

    SectionTitle(tr('order.terms_s5_company_title')),
    BulletPoint(tr('order.terms_5_1')),
    BulletPoint(tr('order.terms_5_2')),

    SectionTitle(tr('order.terms_s6_title')),
    BulletPoint(tr('order.terms_6_1')),
    BulletPoint(tr('order.terms_6_2')),
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