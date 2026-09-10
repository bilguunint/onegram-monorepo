import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Захиалгын үйлчилгээний нөхцөл — зураг + нэг картанд гарчиг/цэгүүд.
/// Column дотор ашиглагддаг тул Expanded-оор ороосон хэвээр.
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
        padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 16.0),
        children: <Widget>[
          const SizedBox(height: 12.0),
          SizedBox(
            height: 130.0,
            child: SvgPicture.asset(
              "assets/icons/agreement-dark.svg",
            ),
          ),
          const SizedBox(height: 16.0),
          AppCard(
            child: Column(
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
      padding: const EdgeInsets.only(top: 14.0, bottom: 8.0),
      child: Text(
        text,
        style: AppText.sectionTitle,
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
      padding: const EdgeInsets.only(top: 12.0, bottom: 6.0),
      child: Text(
        text,
        style: AppText.bodyBold,
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
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: AppText.body.copyWith(height: 1.5),
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
      padding: const EdgeInsets.only(left: 4.0, bottom: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('•  ',
              style: AppText.body
                  .copyWith(height: 1.5, color: CustomColors.accent)),
          Expanded(
            child: Text(
              text,
              style: AppText.body.copyWith(
                  height: 1.5, color: Colors.white.withOpacity(0.85)),
            ),
          ),
        ],
      ),
    );
  }
}
