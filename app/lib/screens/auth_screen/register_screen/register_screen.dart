import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/register_bloc/register_bloc.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'register_view.dart';
import 'verify_view.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen(
      {super.key,
      required this.authenticationRepository,
      required this.phoneNum,
      required this.userRepository
      });
  final AuthRepository authenticationRepository;
  final UserRepository userRepository;
  final String phoneNum;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: CustomColors.scaffoldDarkBack,
        title: Text(tr('reg.sign_up')),
        centerTitle: false,
        elevation: 0,
      ),
      backgroundColor: CustomColors.scaffoldDarkBack,
      body: BlocProvider(
        create: (context) {
          return RegisterBloc(
            authRepository: widget.authenticationRepository,
            userRepository: widget.userRepository,
          );
        },
        child: RegisterView(
          input: widget.phoneNum,
          authenticationRepository: widget.authenticationRepository,
        ),
      ),
    );
  }
}
