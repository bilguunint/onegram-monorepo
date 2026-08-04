import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/order_agreement_screen.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/privacy_screen.dart';
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
      appBar: AppBar(
        title: Text(tr('reg.help_title')),
      ),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8.0, top: 16.0),
            child: Text(
              tr('reg.help_about'),
              style: const TextStyle(fontFamily: "InterBold"),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8.0),
                  color: CustomColors.darkContainerColor),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: () {
                      final Uri _url = Uri.parse(
                          'https://oggspace.sgp1.digitaloceanspaces.com/one-intro.pdf');
                      launchUrl(_url);
                    },
                    child: Container(
                      height: 60.0,
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(FluentIcons.book_information_24_regular),
                              const SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                tr('reg.help_project_intro'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.0),
                              ),
                            ],
                          ),
                          Icon(
                            Ionicons.chevron_forward,
                            color: CustomColors.textGrey.withOpacity(0.6),
                            size: 18.0,
                          )
                        ],
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => PrivacyScreen(
                                )),
                      );
                    },
                    child: Container(
                      height: 60.0,
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(FluentIcons
                                  .clipboard_task_list_rtl_24_regular),
                              const SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                tr('purchase.terms_title'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.0),
                              ),
                            ],
                          ),
                          Icon(
                            Ionicons.chevron_forward,
                            color: CustomColors.textGrey.withOpacity(0.6),
                            size: 18.0,
                          )
                        ],
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => PrivacyScreen(
                                )),
                      );
                    },
                    child: Container(
                      height: 60.0,
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(FluentIcons.shield_keyhole_24_regular),
                              const SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                tr('reg.help_privacy_policy'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.0),
                              ),
                            ],
                          ),
                          Icon(
                            Ionicons.chevron_forward,
                            color: CustomColors.textGrey.withOpacity(0.6),
                            size: 18.0,
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8.0, top: 16.0),
            child: Text(
              tr('reg.help_contact'),
              style: const TextStyle(fontFamily: "InterBold"),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8.0),
                  color: CustomColors.darkContainerColor),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: () =>
                        launchUrl(Uri(scheme: 'tel', path: '75888888')),
                    child: Container(
                      height: 60.0,
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(FluentIcons.call_24_regular),
                              const SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                tr('reg.help_call'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.0),
                              ),
                            ],
                          ),
                          Icon(
                            Ionicons.chevron_forward,
                            color: CustomColors.textGrey.withOpacity(0.6),
                            size: 18.0,
                          )
                        ],
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => launchUrl(Uri(
                      scheme: 'mailto',
                      path: 'info@999.mn',
                    )),
                    child: Container(
                      height: 60.0,
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(FluentIcons.mail_24_regular),
                              const SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                tr('reg.help_email'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.0),
                              ),
                            ],
                          ),
                          Icon(
                            Ionicons.chevron_forward,
                            color: CustomColors.textGrey.withOpacity(0.6),
                            size: 18.0,
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8.0, top: 16.0),
            child: Text(
              tr('reg.help_social'),
              style: const TextStyle(fontFamily: "InterBold"),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8.0),
                  color: CustomColors.darkContainerColor),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: () {
                      final Uri url = Uri.parse(
                          'https://www.facebook.com/onegramgold1');
                      launchUrl(url);
                    },
                    child: Container(
                      height: 60.0,
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              SvgPicture.asset("assets/icons/facebook.svg"),
                              const SizedBox(
                                width: 8.0,
                              ),
                              const Text(
                                "Facebook",
                                style: TextStyle(
                                    fontSize: 12.0,
                                    fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          Icon(
                            Ionicons.chevron_forward,
                            color: CustomColors.textGrey.withOpacity(0.6),
                            size: 18.0,
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}