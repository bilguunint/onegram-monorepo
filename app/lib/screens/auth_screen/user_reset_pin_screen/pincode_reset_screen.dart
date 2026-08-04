import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/user_reset_pin_bloc/user_reset_pin_bloc.dart';
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
      backgroundColor: CustomColors.darkContainerColor,
      appBar: AppBar(
        backgroundColor: CustomColors.darkContainerColor,
        elevation: 0,
        centerTitle: false,
        title: Text(
          tr('auth.reset_pin_title'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14.0,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_outlined, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
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
