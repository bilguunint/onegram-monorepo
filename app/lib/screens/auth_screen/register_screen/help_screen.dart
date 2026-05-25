import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/order_agreement_screen.dart';
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
        title: const Text("Тусламж"),
      ),
      body: ListView(
        children: [
          const Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8.0, top: 16.0),
            child: Text(
              "Тухай",
              style: TextStyle(fontFamily: "InterBold"),
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
                          const Row(
                            children: [
                              Icon(FluentIcons.book_information_24_regular),
                              SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                "Төслийн танилцуулга",
                                style: TextStyle(
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
                          const Row(
                            children: [
                              Icon(FluentIcons
                                  .clipboard_task_list_rtl_24_regular),
                              SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                "Үйлчилгээний нөхцөл",
                                style: TextStyle(
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
                          const Row(
                            children: [
                              Icon(FluentIcons.shield_keyhole_24_regular),
                              SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                "Нууцлалын бодлого",
                                style: TextStyle(
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
          const Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8.0, top: 16.0),
            child: Text(
              "Холбоо барих",
              style: TextStyle(fontFamily: "InterBold"),
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
                          const Row(
                            children: [
                              Icon(FluentIcons.call_24_regular),
                              SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                "Залгах",
                                style: TextStyle(
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
                          const Row(
                            children: [
                              Icon(FluentIcons.mail_24_regular),
                              SizedBox(
                                width: 8.0,
                              ),
                              Text(
                                "И-Мэйл бичих",
                                style: TextStyle(
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
          const Padding(
            padding: const EdgeInsets.only(left: 16.0, bottom: 8.0, top: 16.0),
            child: Text(
              "Сошиал хаяг",
              style: TextStyle(fontFamily: "InterBold"),
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