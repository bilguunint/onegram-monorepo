import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/main_screen.dart';
import 'package:onegrgold/screens/auth_screen/login_screen/login_screen.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/generate_screen.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/register_screen.dart';
import 'package:onegrgold/screens/pincode/enter_pincode_screen.dart';
import 'package:onegrgold/screens/pincode/set_pincode_screen.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onegrgold/style/custom_theme.dart';

import 'bloc/auth_bloc/auth_bloc.dart';
import 'repositories/auth_repository.dart';
import 'repositories/user_repository.dart';

class MyApp extends StatelessWidget {
  final AuthRepository authRepository;
  final UserRepository userRepository;
  static FirebaseAnalytics analytics = FirebaseAnalytics.instance;
  static FirebaseAnalyticsObserver observer =
      FirebaseAnalyticsObserver(analytics: analytics);

  const MyApp({
    super.key,
    required this.authRepository,
    required this.userRepository,
  });

  Widget _buildAuthenticatedScreen(AuthAuthenticated state) {
    return FutureBuilder<bool>(
      future: userRepository.isPincodeSet(state.uid),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Scaffold(
            backgroundColor: CustomColors.darkContainerColor,
            body: const Center(child: CupertinoActivityIndicator()),
          );
        }
        if (snapshot.data!) {
          return EnterPincodeScreen(
            userRepository: userRepository,
            authRepository: authRepository,
            uid: state.uid,
          );
        } else {
          return SetPincodeScreen(
            userRepository: userRepository,
            authRepository: authRepository,
            uid: state.uid,
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: CustomTheme.darkTheme,
        themeMode: ThemeMode.dark,
        navigatorObservers: [
          observer,
        ],
        routes: {
          '/': (context) => BlocConsumer<AuthBloc, AuthState>(
            listener: (context, state) {
              // Force navigation when auth state changes
              print('AuthBloc listener triggered with state: $state');
            },
            builder: (context, state) {
              print('MyApp - AuthBloc building with state: $state');
              if (state is AuthAuthenticated) {
                print('MyApp - Building authenticated screen for uid: ${state.uid}');
                return _buildAuthenticatedScreen(state);
              } else if (state is AuthNeedsRegistration) {
                print('MyApp - Building registration screen');
                return RegisterScreen(authenticationRepository: authRepository, phoneNum: state.phoneNumber, userRepository: userRepository);
              } else if (state is AuthLoading) {
                print('MyApp - Building loading screen');
                return Scaffold(
                  backgroundColor: CustomColors.darkContainerColor,
                  body: const Center(child: CupertinoActivityIndicator()),
                );
              } else if (state is AuthFailure) {
                print('MyApp - Building failure screen: ${state.message}');
                return Scaffold(
                  backgroundColor: CustomColors.darkContainerColor,
                  body: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Auth Error: ${state.message}', style: TextStyle(color: Colors.white)),
                        SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => context.read<AuthBloc>().add(AppStarted()),
                          child: Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                );
              } else {
                // Default to registration/login flow
                return GenerateScreen(
                  authenticationRepository: authRepository,
                );
              }
            },
          ),
        },
        initialRoute: '/',
        );
  }
}
