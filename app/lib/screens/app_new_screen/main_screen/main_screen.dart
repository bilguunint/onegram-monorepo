import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/svg.dart';
import 'package:local_auth/local_auth.dart';
import 'package:onegrgold/bloc/bottom_navbar_bloc.dart';
import 'package:onegrgold/l10n/app_locale.dart';

import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/repositories/version_service.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/home_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/exchange_screen/exchange_screen.dart';
import 'package:onegrgold/screens/app_new_screen/products_screen/products_screen.dart';
import 'package:onegrgold/screens/app_new_screen/profile_screen/profile_screen.dart';
import 'package:onegrgold/screens/test_screen/test_screen.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:url_launcher/url_launcher.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({
    super.key,
    required this.userRepository,
    required this.authRepository,
    required this.uid,
  });

  final UserRepository userRepository;
  final AuthRepository authRepository;
  final String uid;

  static Route<void> route(
      UserRepository userRepository,
      AuthRepository authRepository,
      String uid,) {
    return MaterialPageRoute<void>(
        builder: (_) => MainScreen(
              userRepository: userRepository,
              authRepository: authRepository,
              uid: uid,
            ));
  }

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final BottomNavBarBloc _bottomNavBarBloc = BottomNavBarBloc();
  final LocalAuthentication auth = LocalAuthentication();
  final VersionService _versionService = VersionService();

  late bool canAuthenticate;

  @override
  void initState() {
    super.initState();
    // Check version after a short delay to ensure widget is mounted
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkVersion();
    });
  }

  Future<void> _checkVersion() async {
    await _versionService.checkAndShowUpdateIfNeeded(context);
  }

  @override
  Widget build(BuildContext context) {
    
    return Scaffold(
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      body: StreamBuilder<NavBarItem>(
        stream: _bottomNavBarBloc.itemStream,
        initialData: _bottomNavBarBloc.defaultItem,
        builder: (BuildContext context, AsyncSnapshot<NavBarItem> snapshot) {
          switch (snapshot.data) {
            case NavBarItem.home:
              return HomeScreen(
                userRepository: widget.userRepository,
                authRepository: widget.authRepository,
                uid: widget.uid,
              );
            case NavBarItem.exchange:
              return ExchangeScreen(
                userRepository: widget.userRepository,
                metalId: 1, // Example metal ID, replace with actual logic
              );
            case NavBarItem.products:
              return ProductsScreen(
                uid: widget.uid,
                userRepository: widget.userRepository,
              );
            case NavBarItem.profile:
              return ProfileScreen(
                userRepository: widget.userRepository,
              );
            default:
              return const TestScreen();
          }
        },
      ),
      bottomNavigationBar: StreamBuilder(
        stream: _bottomNavBarBloc.itemStream,
        initialData: _bottomNavBarBloc.defaultItem,
        builder: (BuildContext context, AsyncSnapshot<NavBarItem> snapshot) {
          return Container(
            decoration: BoxDecoration(
                border: Border(
                    top: BorderSide(
                        width: 0.5, color: Colors.grey.withOpacity(0.4)))),
            child: BottomNavigationBar(
              elevation: 0.9,
              iconSize: 21,
              unselectedFontSize: 7.0,
              selectedFontSize: 7.0,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
              type: BottomNavigationBarType.fixed,
              currentIndex: snapshot.data!.index,
              onTap: _bottomNavBarBloc.pickItem,
              items: [
                BottomNavigationBarItem(
                  label: tr('nav.home'),
                  icon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/home.svg",
                        color: Colors.white70,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                  activeIcon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/home-active.svg",
                        color: CustomColors.mainColor,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                ),
                BottomNavigationBarItem(
                  label: tr('nav.rates'),
                  icon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/bar.svg",
                        color: Colors.white70,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                  activeIcon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/bar-active.svg",
                        color: CustomColors.mainColor,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                ),
                BottomNavigationBarItem(
                  label: tr('nav.products'),
                  icon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/shopping-bag.svg",
                        color: Colors.white70,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                  activeIcon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/shopping-bag-active.svg",
                        color: CustomColors.mainColor,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                ),
                BottomNavigationBarItem(
                  label: tr('nav.profile'),
                  icon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/user.svg",
                        color:  Colors.white70,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                  activeIcon: Padding(
                    padding: const EdgeInsets.only(bottom: 4.0, top: 4.0),
                    child: SizedBox(
                      child: SvgPicture.asset(
                        "assets/icons/user-active.svg",
                        color: CustomColors.mainColor,
                        height: 25.0,
                        width: 25.0,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
    
  
}
