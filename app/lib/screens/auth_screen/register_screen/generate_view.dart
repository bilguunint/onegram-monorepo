import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/generate_bloc/generate_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/help_screen.dart';
import 'package:onegrgold/style/colors.dart';
import 'verify_screen.dart';
class GenerateView extends StatefulWidget {
  const GenerateView(
      {super.key,
      required this.authenticationRepository});
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
      return Padding(
        padding:
            const EdgeInsets.only(left: 0.0, bottom: 8.0),
        child: Column(
          children: [
            Expanded(
              child: ListView(
                children: [
                  Padding(
                padding: const EdgeInsets.only(left: 20.0, right: 20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Align(
                        alignment: Alignment.bottomLeft,
                        child: IconButton(
                            onPressed: () {
                              Navigator.push(
                                  context,
                                  CupertinoPageRoute(
                                      builder: (_) => HelpScreen(
                                          )));
                            },
                            icon: Icon(
                              Icons.menu,
                              color: Colors.white,
                              size: 28.0,
                            ))),
                  ],
                ),
              ),
                  const SizedBox(height: 32.0),
                  SizedBox(
                height: 70.0,
                child: Image.asset('assets/images/logo_white_horizontal.png'),
              ),
              const SizedBox(height: 32.0),
                  Padding(
                    padding: const EdgeInsets.only(left: 32.0, right: 32.0),
                    child: Column(
                      children: [
                        const Align(
                                  alignment: Alignment.topLeft,
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Text(
                                      "Утасны дугаар эсвэл и-мэйл хаяг",
                                      style: TextStyle(
                                        fontSize: 12.0,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )),
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
                                "Нэвтрэх",
                                style: TextStyle(color: CustomColors.scaffoldDarkBack, fontWeight: FontWeight.bold, fontSize: 14.0),
                              ),
                              onPress: () {
                                final input = _phoneController.text.trim();
                                final phoneOk = RegExp(r'^[0-9]{8}$').hasMatch(input);
                                final emailOk = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(input);
                                if (phoneOk || emailOk) {
                                  context.read<GenerateBloc>().add(GeneratePressed(input));
                                } else {
                                  showAlertPopUpDialog(
                                    context,
                                    "Утасны дугаар эсвэл и-мэйлээ зөв оруулна уу",
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
