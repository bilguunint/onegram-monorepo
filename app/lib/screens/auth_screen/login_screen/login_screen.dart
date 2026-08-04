import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/svg.dart';

import 'package:onegrgold/l10n/language_switcher.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/generate_screen.dart';
import '../../../../../elements/main_button.dart';
import '../../../../../repositories/auth_repository.dart';
import '../../../../../repositories/user_repository.dart';
import '../../../../../style/colors.dart';

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
          backgroundColor: CustomColors.scaffoldDarkBack,
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
                  padding: const EdgeInsets.only(left: 32.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 35.0,
                        child: Image.asset('assets/images/logo-white.png'),
                      ),
                      SizedBox(height: 32.0),
                      Text(
                        "A New Era in Every Headline.",
                        textAlign: TextAlign.start,
                        style: TextStyle(
                          fontFamily: "InterBlack",
                          fontSize: 18.0
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(left: 32.0, right: 32.0, bottom: 16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: MainButton(
                          isLoading: false,
                          title: Text(
                            tr('auth.sign_in'),
                            style: TextStyle(
                              color: CustomColors.scaffoldDarkBack,
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                            ),
                          ),
                          onPress: () {
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
                    ],
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
