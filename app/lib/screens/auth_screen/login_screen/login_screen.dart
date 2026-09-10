import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/language_switcher.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/generate_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import '../../../../../repositories/auth_repository.dart';
import '../../../../../repositories/user_repository.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.authenticationRepository,
    required this.userRepository,
  });
  final AuthRepository authenticationRepository;
  final UserRepository userRepository;

  static Route route(
    AuthRepository authenticationRepository,
    UserRepository userRepo,
  ) {
    return MaterialPageRoute<void>(
      builder:
          (_) => LoginScreen(
            authenticationRepository: authenticationRepository,
            userRepository: userRepo,
          ),
    );
  }

  @override
  // ignore: library_private_types_in_public_api
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  bool isChecked = false;

  @override
  void initState() {
    /* getShowStatus(); */
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      body: Stack(
        children: [
          _buildBody(context),
          // Language switcher, floated over the top-right corner.
          const SafeArea(
            child: Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: EdgeInsets.only(top: 8, right: 16),
                child: LanguageSwitcherButton(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  height: 40.0,
                  child: Image.asset('assets/images/logo-white.png'),
                ),
                const SizedBox(height: 32.0),
                const Text(
                  "A New Era in Every Headline.",
                  textAlign: TextAlign.center,
                  style: AppText.title,
                ),
              ],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
            child: AppPrimaryButton(
              label: tr('auth.sign_in'),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => GenerateScreen(
                      authenticationRepository:
                          widget.authenticationRepository,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Future<void> getShowStatus() async {
    await storage.read(key: 'intro');
  }

  void afterIntroComplete() {
    storage.write(key: "intro", value: 'intro');
  }
}
