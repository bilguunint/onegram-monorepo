import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/user_reset_pin_screen/pincode_reset_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class UserResetPinView extends StatefulWidget {
  const UserResetPinView(
      {super.key,
      required this.authenticationRepository});
  final AuthRepository authenticationRepository;

  @override
  State<UserResetPinView> createState() => _UserResetPinViewState();
}

class _UserResetPinViewState extends State<UserResetPinView> {
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
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PincodeResetScreen(
              authenticationRepository: widget.authenticationRepository,
              input: state.phone,
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
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr('auth.reset_pin_input_label'),
                        style: AppText.bodyBold.copyWith(fontSize: 13.0),
                      ),
                      const SizedBox(height: 10.0),
                      TextField(
                        key: const Key('loginForm_usernameInput_textField'),
                        keyboardType: TextInputType.emailAddress,
                        focusNode: focusNode,
                        controller: _phoneController,
                        style: AppText.body,
                        cursorColor: CustomColors.accent,
                        decoration: appInputDecoration(),
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
                label: tr('auth.send_verification_code'),
                loading: state is GenerateLoading,
                onPressed: () {
                  FocusScope.of(context).unfocus();
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
