import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'verify_screen.dart';

class GenerateView extends StatefulWidget {
  const GenerateView({super.key, required this.authenticationRepository});
  final AuthRepository authenticationRepository;

  @override
  State<GenerateView> createState() => _GenerateViewState();
}

class _GenerateViewState extends State<GenerateView> {
  @override
  void initState() {
    super.initState();
  }

  final _phoneController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    var focusNode = FocusNode();
    focusNode.requestFocus();
    return BlocListener<GenerateBloc, GenerateState>(
        listener: (context, state) {
      if (state is GenerateFailed) {
        showAlertPopUpDialog(context, state.msg, 65);
      }
      if (state is GenerateSuccess) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VerifyScreen(
              phoneNum: state.phone,
              authenticationRepository: widget.authenticationRepository,
            ),
          ),
        );
      }
    }, child:
            BlocBuilder<GenerateBloc, GenerateState>(builder: (context, state) {
      return Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
              children: [
                const SizedBox(height: 16.0),
                SizedBox(
                  height: 56.0,
                  child:
                      Image.asset('assets/images/logo_white_horizontal.png'),
                ),
                const SizedBox(height: 32.0),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr('auth.phone_or_email_label'),
                        style: AppText.label
                            .copyWith(color: CustomColors.textSecondary),
                      ),
                      const SizedBox(height: 8.0),
                      TextField(
                        key: const Key('loginForm_usernameInput_textField'),
                        keyboardType: TextInputType.emailAddress,
                        focusNode: focusNode,
                        controller: _phoneController,
                        style: AppText.body,
                        cursorColor: CustomColors.accent,
                        decoration: appInputDecoration(
                          prefix: const Icon(Icons.phone_outlined, size: 20.0),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
              child: AppPrimaryButton(
                label: tr('auth.sign_in'),
                loading: state is GenerateLoading,
                onPressed: () {
                  final input = _phoneController.text.trim();
                  final phoneOk = RegExp(r'^[0-9]{8}$').hasMatch(input);
                  final emailOk =
                      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(input);
                  if (phoneOk || emailOk) {
                    context.read<GenerateBloc>().add(GeneratePressed(input));
                  } else {
                    showAlertPopUpDialog(
                      context,
                      tr('auth.phone_or_email_invalid'),
                      60.0,
                    );
                  }
                },
              ),
            ),
          ),
        ],
      );
    }));
  }
}
