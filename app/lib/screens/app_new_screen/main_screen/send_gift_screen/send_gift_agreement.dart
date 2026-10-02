import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/elements/terms_content.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

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
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: <Widget>[
          SizedBox(
            height: 110.0,
            child: SvgPicture.asset("assets/icons/agreement-dark.svg"),
          ),
          const SizedBox(height: 16.0),
          // Firestore terms/gift — админаас удирдана (офлайн бол нөөц текст).
          const AppCard(
            child: TermsContent(termsKey: 'gift'),
          ),
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String text;
  const SectionTitle(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0, bottom: 8.0),
      child: Text(text, style: AppText.sectionTitle),
    );
  }
}

class SubSectionTitle extends StatelessWidget {
  final String text;
  const SubSectionTitle(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12.0, bottom: 6.0),
      child: Text(text, style: AppText.bodyBold),
    );
  }
}

class SectionText extends StatelessWidget {
  final String text;
  const SectionText(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(text, style: AppText.body.copyWith(height: 1.5)),
    );
  }
}

class BulletPoint extends StatelessWidget {
  final String text;
  const BulletPoint(this.text, {super.key});

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
                  height: 1.5, color: Colors.white.withOpacity(0.86)),
            ),
          ),
        ],
      ),
    );
  }
}
