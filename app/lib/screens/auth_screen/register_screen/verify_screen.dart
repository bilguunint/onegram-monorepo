import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/verify_bloc/verify_bloc.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'verify_view.dart';

class VerifyScreen extends StatefulWidget {
  const VerifyScreen(
      {super.key,
      required this.authenticationRepository,
      required this.phoneNum});
  final AuthRepository authenticationRepository;
  final String phoneNum;

  @override
  State<VerifyScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends State<VerifyScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('reg.verification_code')),
      body: BlocProvider(
        create: (context) {
          return VerifyBloc(
            authRepository: widget.authenticationRepository,
          );
        },
        child: SafeArea(
          child: VerifyView(
            phoneNum: widget.phoneNum,
            authenticationRepository: widget.authenticationRepository,
          ),
        ),
      ),
    );
  }
}
