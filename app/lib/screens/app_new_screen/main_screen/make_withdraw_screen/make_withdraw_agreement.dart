import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

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
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: <Widget>[
          SizedBox(
            height: 110.0,
            child: SvgPicture.asset("assets/icons/agreement-dark.svg"),
          ),
          const SizedBox(height: 16.0),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('order.withdraw_terms_title'),
                    style: AppText.sectionTitle.copyWith(fontSize: 18.0)),
                SectionTitle(tr('order.terms_s1_title')),
                BulletPoint(tr('order.withdraw_terms_1_1')),
                BulletPoint(tr('order.withdraw_terms_1_2')),
                SectionTitle(tr('order.withdraw_terms_s2_title')),
                BulletPoint(tr('order.withdraw_terms_2_1')),
                BulletPoint(tr('order.withdraw_terms_2_2')),
                BulletPoint(tr('order.withdraw_terms_2_3')),
                SectionTitle(tr('order.withdraw_terms_s3_title')),
                BulletPoint(tr('order.withdraw_terms_3_1')),
                const SizedBox(height: 12.0),
                _branchInfo(),
                const SizedBox(height: 12.0),
                BulletPoint(tr('order.withdraw_terms_3_2')),
                BulletPoint(tr('order.withdraw_terms_3_3')),
                BulletPoint(tr('order.withdraw_terms_3_4')),
                BulletPoint(tr('order.withdraw_terms_3_5')),
                SectionTitle(tr('order.terms_s4_company_title')),
                BulletPoint(tr('order.withdraw_terms_4_1')),
                BulletPoint(tr('order.withdraw_terms_4_2')),
                BulletPoint(tr('order.withdraw_terms_4_3')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Салбарын хаяг, утас, цагийн мэдээлэл — картын доторх зөөлөн блок
  Widget _branchInfo() {
    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: CustomColors.surfaceAlt,
        borderRadius: BorderRadius.circular(14.0),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _InfoLine(
            icon: Ionicons.location_outline,
            text: tr('order.withdraw_branches_label'),
            bold: true,
          ),
          const SizedBox(height: 6.0),
          Padding(
            padding: const EdgeInsets.only(left: 28.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('order.withdraw_branch_main'),
                    style: AppText.body.copyWith(height: 1.5)),
                Text(tr('order.withdraw_branch_erdenet'),
                    style: AppText.body.copyWith(height: 1.5)),
              ],
            ),
          ),
          const SizedBox(height: 10.0),
          const _InfoLine(icon: Ionicons.call_outline, text: '7588-8888'),
          const SizedBox(height: 10.0),
          const _InfoLine(icon: Ionicons.alarm_outline, text: '10:00 - 18:00'),
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.text, this.bold = false});

  final IconData icon;
  final String text;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18.0, color: CustomColors.accent),
        const SizedBox(width: 10.0),
        Expanded(
          child: Text(
            text,
            style: bold
                ? AppText.bodyBold
                : AppText.body.copyWith(height: 1.5),
          ),
        ),
      ],
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
