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
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/make_order_screen.dart';
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
    String uid,
  ) {
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
      floatingActionButton: SizedBox(
        width: 56.0,
        height: 56.0,
        child: FloatingActionButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => MakeOrderScreen(
                  userRepository: widget.userRepository,
                  uid: widget.uid,
                  metalId: 1, // Gold by default
                ),
              ),
            );
          },
          backgroundColor: Colors.transparent,
          elevation: 0.0,
          highlightElevation: 0.0,
          shape: const CircleBorder(),
          // add.svg өөрөө алтан gradient дугуй + "+" бүхий бүрэн товч тул
          // өнгө tint хийхгүй; viewBox-ийн захын зайг нөхөхөөр томруулна.
          child: OverflowBox(
            maxWidth: 76.0,
            maxHeight: 76.0,
            child: SvgPicture.asset(
              "assets/icons/add.svg",
              height: 76.0,
              width: 76.0,
            ),
          ),
        ),
      ),
      bottomNavigationBar: StreamBuilder<NavBarItem>(
        stream: _bottomNavBarBloc.itemStream,
        initialData: _bottomNavBarBloc.defaultItem,
        builder: (BuildContext context, AsyncSnapshot<NavBarItem> snapshot) {
          final int current = snapshot.data!.index;
          // BottomAppBar доод safe area-г бүхлээр нь нэмдэг тул өөрсдөө
          // удирдаж, хоосон зайг багасгана.
          final double bottomPad =
              (MediaQuery.of(context).padding.bottom - 14.0).clamp(0.0, 40.0);
          return MediaQuery.removePadding(
            context: context,
            removeBottom: true,
            child: BottomAppBar(
              color: CustomColors.bottomDarkBack,
              shape: const CircularNotchedRectangle(),
              notchMargin: 8.0,
              padding: EdgeInsets.zero,
              elevation: 0.0,
              child: Container(
                padding: EdgeInsets.only(bottom: bottomPad),
                decoration: BoxDecoration(
                    border: Border(
                        top: BorderSide(
                            width: 1.0, color: CustomColors.surfaceBorder))),
                child: SizedBox(
                  height: 46.0,
                  child: Row(
                    children: [
                      Expanded(
                          child: _navItem(0, current, "home", tr('nav.home'))),
                      Expanded(
                          child: _navItem(1, current, "bar", tr('nav.rates'))),
                      // Голын "Захиалах" товчны зай
                      const SizedBox(width: 64.0),
                      Expanded(
                          child: _navItem(
                              2, current, "shopping-bag", tr('nav.products'))),
                      Expanded(
                          child:
                              _navItem(3, current, "user", tr('nav.profile'))),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _navItem(int index, int current, String asset, String label) {
    final bool active = index == current;
    final Color color = active ? CustomColors.accent : Colors.white60;
    return InkWell(
      onTap: () => _bottomNavBarBloc.pickItem(index),
      child: Column(
        children: [
          // Идэвхтэй табын дээд ирмэгийн богино зураас
          Container(
            width: 26.0,
            height: 3.0,
            decoration: BoxDecoration(
              color: active ? CustomColors.accent : Colors.transparent,
              borderRadius:
                  const BorderRadius.vertical(bottom: Radius.circular(3.0)),
            ),
          ),
          Expanded(
            child: Center(
              child: Semantics(
                label: label,
                child: SvgPicture.asset(
                  "assets/icons/$asset-active.svg",
                  color: color,
                  height: 24.0,
                  width: 24.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
