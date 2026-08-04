import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/user_reset_pin_screen/user_reset_pin_view.dart';

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
      appBar: AppBar(
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
