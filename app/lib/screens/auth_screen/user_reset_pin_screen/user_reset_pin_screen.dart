import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/user_reset_pin_screen/user_reset_pin_view.dart';
import 'package:onegrgold/style/colors.dart';

class UserResetPinScreen extends StatefulWidget {
  const UserResetPinScreen(
      {super.key,
      required this.authenticationRepository,});
  final AuthRepository authenticationRepository;

  @override
  State<UserResetPinScreen> createState() => _UserResetPinScreenState();
}

class _UserResetPinScreenState extends State<UserResetPinScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('auth.reset_pin_title')),
      body: BlocProvider(
        create: (context) {
          return GenerateBloc(
            authRepository: widget.authenticationRepository,
          );
        },
        child: UserResetPinView(
          authenticationRepository: widget.authenticationRepository,
        ),
      ),
    );
  }
}
