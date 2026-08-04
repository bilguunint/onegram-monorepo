import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/user_reset_pin_screen/pincode_reset_screen.dart';
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
      return Padding(
        padding:
            const EdgeInsets.only(left: 0.0, bottom: 8.0),
        child: Column(
          children: [
            Expanded(
              child: ListView(
                children: [
              const SizedBox(height: 32.0),
                  Padding(
                    padding: const EdgeInsets.only(left: 32.0, right: 32.0),
                    child: Column(
                      children: [
                        Align(
                                  alignment: Alignment.topLeft,
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Text(
                                      tr('auth.reset_pin_input_label'),
                                      style: const TextStyle(
                                        fontSize: 12.0,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )),
                                  SizedBox(height: 8.0),
                        TextField(
                          key: const Key('loginForm_usernameInput_textField'),
                          keyboardType: TextInputType.emailAddress,
                          focusNode: focusNode,
                          controller: _phoneController,
                          style: const TextStyle(
                              fontSize: 14.0, fontWeight: FontWeight.bold),
                          decoration: InputDecoration(
                            filled: true,
                            contentPadding:
                                const EdgeInsets.only(left: 10.0, right: 10.0),
                            hintStyle: TextStyle(
                                fontSize: 12.0,
                                color: CustomColors.grey,
                                fontWeight: FontWeight.w500),
                            labelStyle: const TextStyle(
                                fontSize: 12.0,
                                color: Colors.grey,
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    height: 24.0,
                  ),
                  
                ],
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16.0, left: 32.0, right: 32.0),
                child: Row(
                      children: [
                        Expanded(
                          child: MainButton(
                              title:  Text(
                                tr('auth.send_verification_code'),
                                style: TextStyle(color: CustomColors.scaffoldDarkBack, fontWeight: FontWeight.bold, fontSize: 14.0),
                              ),
                              onPress: () {
                                FocusScope.of(context).unfocus();
                                final input = _phoneController.text.trim();
                                final phoneOk = RegExp(r'^[0-9]{8}$').hasMatch(input);
                                final emailOk = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(input);
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
                              isLoading: state is GenerateLoading),
                        ),
                      ],
                    ),
              ),
            ),
          ],
        ),
      );
    }));
  }
}
