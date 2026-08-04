import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/l10n/app_locale.dart';



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
    SectionTitle(tr('order.withdraw_terms_title')),

    SectionTitle(tr('order.terms_s1_title')),
    BulletPoint(tr('order.withdraw_terms_1_1')),
    BulletPoint(tr('order.withdraw_terms_1_2')),

    SectionTitle(tr('order.withdraw_terms_s2_title')),
    BulletPoint(tr('order.withdraw_terms_2_1')),
    BulletPoint(tr('order.withdraw_terms_2_2')),
    BulletPoint(tr('order.withdraw_terms_2_3')),

    SectionTitle(tr('order.withdraw_terms_s3_title')),
    BulletPoint(tr('order.withdraw_terms_3_1')),
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
                            Text(tr('order.withdraw_branches_label'), style: TextStyle(
                              color: Colors.blue.shade300,
                              fontSize: 14.0,
                            ),),
                          ],
                        ),
                        Text(
                          tr('order.withdraw_branch_main'),
                          style: TextStyle(
                            color: Colors.blue.shade300,
                            fontSize: 14.0,
                          ),
                        ),
                        Text(
                          tr('order.withdraw_branch_erdenet'),
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
    BulletPoint(tr('order.withdraw_terms_3_2')),
    BulletPoint(tr('order.withdraw_terms_3_3')),
    BulletPoint(tr('order.withdraw_terms_3_4')),
    BulletPoint(tr('order.withdraw_terms_3_5')),

    SectionTitle(tr('order.terms_s4_company_title')),
    BulletPoint(tr('order.withdraw_terms_4_1')),
    BulletPoint(tr('order.withdraw_terms_4_2')),
    BulletPoint(tr('order.withdraw_terms_4_3')),
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