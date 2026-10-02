import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/elements/terms_content.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Үйлчилгээний нөхцөл — зураг + нэг картанд Firestore `terms/{termsKey}`-ийн
/// текст (админаас удирдана; офлайн бол аппд шигтгэсэн нөөц текст).
/// Column дотор ашиглагддаг тул Expanded-оор ороосон хэвээр.
class OrderAgreement extends StatelessWidget {
  /// `general` (ерөнхий нөхцөл), `privacy` (нууцлалын бодлого) гэх мэт.
  final String termsKey;

  const OrderAgreement({super.key, this.termsKey = 'general'});

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
            child: TermsContent(termsKey: termsKey),
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
