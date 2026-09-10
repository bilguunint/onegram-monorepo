import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/auth_bloc/auth_bloc.dart';
import 'package:onegrgold/bloc/verify_bloc/verify_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/app_text.dart';
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
                showAlertPopUpDialog(context,
                    tr('reg.sign_in_error', {'error': state.message}), 65.0);
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
          return Form(
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
                    children: [
                      Text(
                        tr('reg.verification_code_sent',
                            {'phone': widget.phoneNum}),
                        style: AppText.caption.copyWith(fontSize: 14.0),
                      ),
                      const SizedBox(height: 24.0),
                      AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            PinCodeTextField(
                              autofocus: true,
                              controller: _code,
                              hideCharacter: false,
                              isCupertino: true,
                              highlightColor: CustomColors.accent,
                              defaultBorderColor: CustomColors.surfaceBorder,
                              pinBoxColor: CustomColors.surfaceAlt,
                              highlightPinBoxColor: CustomColors.surfaceAlt,
                              pinBoxRadius: 12.0,
                              pinBoxBorderWidth: 1.0,
                              hasTextBorderColor: CustomColors.accent,
                              maxLength: 4,
                              pinBoxWidth: 56.0,
                              pinBoxHeight: 56.0,
                              pinBoxOuterPadding:
                                  const EdgeInsets.symmetric(horizontal: 6.0),
                              onDone: (text) {
                                if (mounted) {
                                  setState(() {
                                    _code.text = text;
                                  });
                                }
                              },
                              wrapAlignment: WrapAlignment.center,
                              pinBoxDecoration: ProvidedPinBoxDecoration
                                  .defaultPinBoxDecoration,
                              pinTextStyle: AppText.displayUnit,
                              pinTextAnimatedSwitcherTransition:
                                  ProvidedPinBoxTextAnimation
                                      .scalingTransition,
                              pinTextAnimatedSwitcherDuration:
                                  const Duration(milliseconds: 10),
                            ),
                            const SizedBox(height: 20.0),
                            Text(
                              tr('reg.otp_not_received'),
                              textAlign: TextAlign.center,
                              style: AppText.caption,
                            ),
                            const SizedBox(height: 6.0),
                            if (_start > 0)
                              Text(
                                '${tr('reg.resend_code')}  ·  ${_start}s',
                                textAlign: TextAlign.center,
                                style: AppText.caption
                                    .copyWith(color: CustomColors.textTertiary),
                              )
                            else
                              Text(
                                tr('reg.resend_code'),
                                textAlign: TextAlign.center,
                                style: AppText.link,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
                    child: AppPrimaryButton(
                      label: tr('common.confirm'),
                      loading: isLoading || isClicked,
                      onPressed: _code.value.text.length == 4 && !isClicked
                          ? () {
                              if (mounted) {
                                setState(() {
                                  isLoading = true;
                                  isClicked = true;
                                });
                                context.read<VerifyBloc>().add(
                                    VerifyPressed(widget.phoneNum, _code.text));
                              }
                            }
                          : null,
                    ),
                  ),
                ),
              ],
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
