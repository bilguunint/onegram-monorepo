import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/language_switcher.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/help_screen.dart';
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
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(
        '',
        actions: [
          // Language switcher — this is the first screen an unauthenticated
          // user sees.
          const Padding(
            padding: EdgeInsets.only(right: 4.0),
            child: LanguageSwitcherButton(),
          ),
          IconButton(
            tooltip: '',
            onPressed: () {
              Navigator.push(
                  context, CupertinoPageRoute(builder: (_) => const HelpScreen()));
            },
            icon: const Icon(
              Icons.help_outline_rounded,
              color: Colors.white,
              size: 24.0,
            ),
          ),
          const SizedBox(width: 4.0),
        ],
      ),
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
