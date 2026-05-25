import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'generate_view.dart';

class GenerateScreen extends StatefulWidget {
  const GenerateScreen(
      {super.key,
      required this.authenticationRepository,});
  final AuthRepository authenticationRepository;

  @override
  State<GenerateScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends State<GenerateScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.darkContainerColor,
     
      body: BlocProvider(
        create: (context) {
          return GenerateBloc(
            authRepository: widget.authenticationRepository,
          );
        },
        child: GenerateView(
          authenticationRepository: widget.authenticationRepository,
        ),
      ),
    );
  }
}
