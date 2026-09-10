import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/privacy_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({
    super.key,
  });

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('reg.help_title')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
        children: [
          _sectionTitle(tr('reg.help_about')),
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: Column(
              children: [
                AppListRow(
                  title: tr('reg.help_project_intro'),
                  leading: const _HelpIcon(FluentIcons.book_information_24_regular),
                  onTap: () {
                    final Uri url = Uri.parse(
                        'https://oggspace.sgp1.digitaloceanspaces.com/one-intro.pdf');
                    launchUrl(url);
                  },
                ),
                const AppDivider(vertical: 2.0),
                AppListRow(
                  title: tr('purchase.terms_title'),
                  leading: const _HelpIcon(
                      FluentIcons.clipboard_task_list_rtl_24_regular),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const PrivacyScreen()),
                    );
                  },
                ),
                const AppDivider(vertical: 2.0),
                AppListRow(
                  title: tr('reg.help_privacy_policy'),
                  leading: const _HelpIcon(FluentIcons.shield_keyhole_24_regular),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const PrivacyScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
          _sectionTitle(tr('reg.help_contact')),
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: Column(
              children: [
                AppListRow(
                  title: tr('reg.help_call'),
                  leading: const _HelpIcon(FluentIcons.call_24_regular),
                  onTap: () => launchUrl(Uri(scheme: 'tel', path: '75888888')),
                ),
                const AppDivider(vertical: 2.0),
                AppListRow(
                  title: tr('reg.help_email'),
                  leading: const _HelpIcon(FluentIcons.mail_24_regular),
                  onTap: () => launchUrl(Uri(
                    scheme: 'mailto',
                    path: 'info@999.mn',
                  )),
                ),
              ],
            ),
          ),
          _sectionTitle(tr('reg.help_social')),
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: AppListRow(
              title: "Facebook",
              leading: AppIconTile(
                size: 40.0,
                child: SizedBox(
                  width: 20.0,
                  height: 20.0,
                  child: SvgPicture.asset("assets/icons/facebook.svg"),
                ),
              ),
              onTap: () {
                final Uri url =
                    Uri.parse('https://www.facebook.com/onegramgold1');
                launchUrl(url);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0, bottom: 10.0),
      child: Text(text, style: AppText.sectionTitle),
    );
  }
}

/// Тусламжийн мөрийн зүүн icon tile
class _HelpIcon extends StatelessWidget {
  const _HelpIcon(this.icon);
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return AppIconTile(
      size: 40.0,
      child: Icon(icon, size: 20.0, color: CustomColors.accent),
    );
  }
}
