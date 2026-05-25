/* import 'dart:async';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'bloc/auth_bloc/auth_bloc.dart';
import 'repositories/authentication_repository.dart';
import 'repositories/user_repository.dart';
import 'screens/login_screen/login_screen.dart';
import 'screens/main_screen/main_screen.dart';
import 'screens/splash_page.dart';
import 'style/custom_theme.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late final AuthenticationRepository _authenticationRepository;
  late final UserRepository _userRepository;

  @override
  void initState() {
    super.initState();
    _authenticationRepository = AuthenticationRepository();
    _userRepository = UserRepository();
  }

  @override
  void dispose() {
    _authenticationRepository.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepositoryProvider.value(
      value: _authenticationRepository,
      child: BlocProvider(
        create: (_) => AuthenticationBloc(
          authenticationRepository: _authenticationRepository,
          userRepository: _userRepository,
        ),
        child: AppView(
          authenticationRepository: _authenticationRepository,
          userRepository: _userRepository,
        ),
      ),
    );
  }
}

class AppView extends StatefulWidget {
  const AppView(
      {super.key,
      required this.authenticationRepository,
      required this.userRepository,});
  final AuthenticationRepository authenticationRepository;
  final UserRepository userRepository;

  @override
  State<AppView> createState() => _AppViewState();
}

class _AppViewState extends State<AppView> {
  final _navigatorKey = GlobalKey<NavigatorState>();

  NavigatorState get _navigator => _navigatorKey.currentState!;
  static FirebaseAnalytics analytics = FirebaseAnalytics.instance;
  static FirebaseAnalyticsObserver observer =
      FirebaseAnalyticsObserver(analytics: analytics);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        navigatorKey: _navigatorKey,
        theme: CustomTheme.darkTheme,
        themeMode: ThemeMode.dark,
        navigatorObservers: [
          observer,
        ],
        builder: (context, child) {
          return  BlocListener<AuthenticationBloc, AuthenticationState>(
          listener: (context, state) {
            switch (state.status) {
              case AuthenticationStatus.authenticated:
                _navigator.pushAndRemoveUntil<void>(
                  MainScreen.route(
                      widget.userRepository,
                      widget.authenticationRepository,
                      state.loginData),
                  (route) => false,
                );
              case AuthenticationStatus.unauthenticated:
                _navigator.pushAndRemoveUntil<void>(
                  LoginScreen.route(
                      widget.authenticationRepository,
                      state.loginData,
                      widget.userRepository),
                  (route) => false,
                );
    
              case AuthenticationStatus.unknown:
                break;
            }
          },
          child: child,
        );
        },
        onGenerateRoute: (_) => SplashPage.route(),
      );
  }
}
 */