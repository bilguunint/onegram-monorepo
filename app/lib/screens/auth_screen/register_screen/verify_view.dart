import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/auth_bloc/auth_bloc.dart';
import 'package:onegrgold/bloc/verify_bloc/verify_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';

class VerifyView extends StatefulWidget {
  const VerifyView({
    super.key,
    required this.authenticationRepository,
    required this.phoneNum,
  });
  final AuthRepository authenticationRepository;
  final String phoneNum;

  @override
  State<VerifyView> createState() => _VerifyViewState();
}

class _VerifyViewState extends State<VerifyView> {
  final _code = TextEditingController();
  bool isClicked = false;
  bool isLoading = false;
  late Timer _timer;
  int _start = 60;

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  @override
  void dispose() {
    _timer.cancel();
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<VerifyBloc, VerifyState>(
          listener: (context, state) {
            print('VerifyBloc state: $state');
            if (state is VerifyFailed) {
              if (mounted) {
                setState(() {
                  isClicked = false;
                  _code.text = '';
                });
                showAlertPopUpDialog(context, state.msg, 65.0);
              }
            }
            if (state is VerifySuccess) {
              print('Verify Success - dispatching LoggedIn event');
              if (mounted) {
                setState(() {
                  isClicked = false; // Reset button state
                });
                // Dispatch the LoggedIn event
                context.read<AuthBloc>().add(LoggedIn(state.loginResponse));
              }
            }
          },
        ),
        BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            print('VerifyView AuthBloc listener: $state');
            if (state is AuthAuthenticated) {
              print(
                  'VerifyView: AuthAuthenticated detected with uid: ${state.uid}');
              print('VerifyView: Navigating to authenticated screen');

              // Use pushNamedAndRemoveUntil to completely reset navigation stack
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  try {
                    // Force complete navigation reset to root with authenticated state
                    Navigator.of(context)
                        .pushNamedAndRemoveUntil('/', (route) => false);
                    print(
                        'VerifyView: Successfully reset navigation to root - MyApp should rebuild with authenticated state');
                    setState(() {
                      isLoading = false;
                    });
                  } catch (e) {
                    print('VerifyView: Navigation reset failed: $e');
                    setState(() {
                      isLoading = false;
                    });
                    // Fallback: try simple pop
                    try {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                      print('VerifyView: Fallback pop completed');
                      setState(() {
                        isLoading = false;
                      });
                    } catch (e2) {
                      print('VerifyView: Fallback pop also failed: $e2');
                      setState(() {
                        isLoading = false;
                      });
                    }
                  }
                }
              });
            } else if (state is AuthFailure) {
              print('VerifyView: AuthFailure detected: ${state.message}');
              if (mounted) {
                setState(() {
                  isClicked = false;
                  isLoading = false;
                });
                showAlertPopUpDialog(
                    context, 'Нэвтрэхэд алдаа гарлаа: ${state.message}', 65.0);
              }
            } else if (state is AuthNeedsRegistration) {
              // Use pushNamedAndRemoveUntil to completely reset navigation stack
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  try {
                    // Force complete navigation reset to root with authenticated state
                    Navigator.of(context)
                        .pushNamedAndRemoveUntil('/', (route) => false);
                    print(
                        'VerifyView: Successfully reset navigation to root - MyApp should rebuild with authenticated state');
                    setState(() {
                      isLoading = false;
                    });
                  } catch (e) {
                    print('VerifyView: Navigation reset failed: $e');
                    setState(() {
                      isLoading = false;
                    });
                    // Fallback: try simple pop
                    try {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                      setState(() {
                        isLoading = false;
                      });
                      print('VerifyView: Fallback pop completed');
                    } catch (e2) {
                      print('VerifyView: Fallback pop also failed: $e2');
                      setState(() {
                        isLoading = false;
                      });
                    }
                  }
                }
              });
            }
          },
        ),
      ],
      child: BlocBuilder<VerifyBloc, VerifyState>(
        builder: (context, state) {
          return Padding(
            padding: const EdgeInsets.only(right: 32.0, left: 32.0),
            child: Form(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(
                            bottom: 8.0, top: 16.0, right: 32.0),
                        child: Text(
                          "Баталгаажуулах код",
                          style: TextStyle(
                              fontSize: 18.0, fontFamily: "InterBold"),
                        ),
                      ),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "Бид таны ${widget.phoneNum} дугаарт баталгаажуулах код мессежээр илгээлээ. Кодоо оруулан нэвтрэх эрхээ баталгаажуулна уу.",
                          style: const TextStyle(
                              fontSize: 14.0, color: Colors.white60),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 16.0,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 16.0, bottom: 16.0),
                    child: PinCodeTextField(
                      autofocus: true,
                      controller: _code,
                      hideCharacter: false,
                      isCupertino: true,
                      highlightColor: CustomColors.mainColor,
                      defaultBorderColor: Colors.white12,
                      pinBoxColor: CustomColors.inputDarkColor,
                      pinBoxRadius: 3.0,
                      hasTextBorderColor: CustomColors.mainColor,
                      maxLength: 4,
                      pinBoxWidth: 45.0,
                      pinBoxHeight: 45.0,
                      onDone: (text) {
                        if (mounted) {
                          setState(() {
                            _code.text = text;
                          });
                        }
                      },
                      wrapAlignment: WrapAlignment.spaceAround,
                      pinBoxDecoration:
                          ProvidedPinBoxDecoration.defaultPinBoxDecoration,
                      pinTextStyle: const TextStyle(
                          fontSize: 18.0, fontWeight: FontWeight.bold),
                      pinTextAnimatedSwitcherTransition:
                          ProvidedPinBoxTextAnimation.scalingTransition,
                      pinTextAnimatedSwitcherDuration:
                          const Duration(milliseconds: 10),
                    ),
                  ),
                  const SizedBox(
                    height: 16.0,
                  ),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Text(
                        "OTP код ирээгүй юу?",
                        style: TextStyle(fontSize: 14.0, color: Colors.white54),
                      ),
                      SizedBox(
                        height: 4.0,
                      ),
                      Text(
                        "Код дахин авах",
                        style: TextStyle(
                            fontSize: 14.0,
                            decoration: TextDecoration.underline,
                            fontWeight: FontWeight.bold,
                            color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 32.0,
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: MainButton(
                            isLoading: isLoading || isClicked,
                            title: Text(
                              "Баталгаажуулах",
                              style: TextStyle(
                                  color: CustomColors.scaffoldDarkBack,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14.0),
                            ),
                            onPress: _code.value.text.length == 4 && !isClicked
                                ? () {
                                    if (mounted) {
                                      setState(() {
                                        isLoading = true;
                                        isClicked = true;
                                      });
                                      context.read<VerifyBloc>().add(
                                          VerifyPressed(
                                              widget.phoneNum, _code.text));
                                    }
                                  }
                                : null),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 32.0,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void startTimer() {
    const oneSec = Duration(seconds: 1);
    _timer = Timer.periodic(
      oneSec,
      (Timer timer) {
        if (_start == 0) {
          if (mounted) {
            setState(() {
              timer.cancel();
            });
          } else {
            timer.cancel();
          }
        } else {
          if (mounted) {
            setState(() {
              _start--;
            });
          }
        }
      },
    );
  }
}
