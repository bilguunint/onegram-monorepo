import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/user_reset_pin_bloc/user_reset_pin_bloc.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/user_reset_pin_screen/pincode_reset_form.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onegrgold/l10n/app_locale.dart';

class PincodeResetScreen extends StatefulWidget {
  const PincodeResetScreen({
    super.key,
    required this.authenticationRepository,
    required this.input,
  });
  final AuthRepository authenticationRepository;
  final String input;

  @override
  State<PincodeResetScreen> createState() => _PincodeResetScreenState();
}

class _PincodeResetScreenState extends State<PincodeResetScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('auth.reset_pin_title')),
      body: BlocProvider(
        create: (context) => UserResetPinBloc(
          authRepository: widget.authenticationRepository,
        ),
        child: PincodeResetForm(
          authenticationRepository: widget.authenticationRepository,
          input: widget.input,
        ),
      ),
    );
  }
}
