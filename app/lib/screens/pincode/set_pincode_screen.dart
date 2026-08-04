import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/material.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/main_screen.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';

class SetPincodeScreen extends StatefulWidget {
  const SetPincodeScreen({
    super.key,
    required this.userRepository,
    required this.authRepository,
    required this.uid,
  });

  final UserRepository userRepository;
  final AuthRepository authRepository;
  final String uid;

  @override
  State<SetPincodeScreen> createState() => _SetPincodeScreenState();
}

class _SetPincodeScreenState extends State<SetPincodeScreen> {
  final _firstController = TextEditingController();
  final _confirmController = TextEditingController();
  PageController pageController = PageController();
  bool _loading = false;
  bool _isConfirmStep = false;

  void _onKeyboardTap(String value) {
    final controller = _isConfirmStep ? _confirmController : _firstController;
    if (controller.text.length >= 6) return;
    setState(() => controller.text = controller.text + value);
  }

  void _onBackspace() {
    final controller = _isConfirmStep ? _confirmController : _firstController;
    if (controller.text.isEmpty) return;
    setState(() => controller.text =
        controller.text.substring(0, controller.text.length - 1));
  }

  void _onClear() {
    final controller = _isConfirmStep ? _confirmController : _firstController;
    if (controller.text.isEmpty) return;
    setState(() => controller.text = '');
  }

  Future<void> _nextOrSave() async {
    if (!_isConfirmStep) {
      if (_firstController.text.length < 6) {
        showAlertPopUpDialog(context, tr('auth.set_pin_must_be_6'), 60.0);
        return;
      }
      setState(() => _isConfirmStep = true);
      pageController.animateToPage(
        1,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeIn,
      );
      return;
    }

    if (_confirmController.text.length < 6) {
      showAlertPopUpDialog(context, tr('auth.set_pin_must_be_6'), 60.0);
      return;
    }

    if (_firstController.text != _confirmController.text) {
      showAlertPopUpDialog(context, tr('auth.pin_mismatch'), 75.0);
      _confirmController.clear();
      setState(() {});
      return;
    }

    setState(() => _loading = true);
    try {
      await widget.userRepository.setPincode(_firstController.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => MainScreen(
            userRepository: widget.userRepository,
            authRepository: widget.authRepository,
            uid: widget.uid,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      showAlertPopUpDialog(context, tr('auth.pin_save_failed'), 60.0);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: CustomColors.scaffoldDarkBack,
        title: Text(tr('auth.user_pin_title')),
        centerTitle: false,
        elevation: 0,
      ),
      backgroundColor: CustomColors.scaffoldDarkBack,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            children: [
              Expanded(
                child: Column(children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Text(
                          tr('auth.set_pin_intro'),
                          style: const TextStyle(
                            fontSize: 14.0,
                            color: Colors.white38,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16.0),
                  Expanded(
                    child: PageView(
                      physics: const NeverScrollableScrollPhysics(),
                      controller: pageController,
                      children: [
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              tr('auth.enter_your_pin'),
                              style: const TextStyle(
                                  fontSize: 13.0, color: Colors.white),
                              textAlign: TextAlign.start,
                            ),
                            const SizedBox(height: 16.0),
                            IgnorePointer(
                              ignoring: true,
                              child: PinCodeTextField(
                                controller: _firstController,
                                maxLength: 6,
                                autofocus: false,
                                isCupertino: true,
                                hideCharacter: true,
                                highlightColor: CustomColors.mainColor,
                                defaultBorderColor: Colors.white12,
                                pinBoxColor: CustomColors.inputDarkColor,
                                pinBoxRadius: 8.0,
                                pinBoxBorderWidth: 1.0,
                                hasTextBorderColor: CustomColors.mainColor,
                                pinBoxWidth: 40.0,
                                pinBoxHeight: 40.0,
                                onDone: (_) {},
                                wrapAlignment: WrapAlignment.spaceAround,
                                pinBoxDecoration: ProvidedPinBoxDecoration
                                    .defaultPinBoxDecoration,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              tr('auth.reenter_your_pin_confirm'),
                              style: const TextStyle(
                                  fontSize: 13.0, color: Colors.white),
                              textAlign: TextAlign.start,
                            ),
                            const SizedBox(height: 16.0),
                            IgnorePointer(
                              ignoring: true,
                              child: PinCodeTextField(
                                controller: _confirmController,
                                maxLength: 6,
                                autofocus: false,
                                isCupertino: true,
                                hideCharacter: true,
                                highlightColor: CustomColors.mainColor,
                                defaultBorderColor: Colors.white12,
                                pinBoxColor: CustomColors.inputDarkColor,
                                pinBoxRadius: 8.0,
                                pinBoxBorderWidth: 1.0,
                                hasTextBorderColor: CustomColors.mainColor,
                                pinBoxWidth: 40.0,
                                pinBoxHeight: 40.0,
                                onDone: (_) {},
                                wrapAlignment: WrapAlignment.spaceAround,
                                pinBoxDecoration: ProvidedPinBoxDecoration
                                    .defaultPinBoxDecoration,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32.0),
                  NumericKeyboard(
                    onKeyboardTap: _onKeyboardTap,
                    textStyle:
                        const TextStyle(fontSize: 24.0, color: Colors.white),
                    rightButtonFn: _onBackspace,
                    rightButtonLongPressFn: _onClear,
                    rightIcon:
                        const Icon(Icons.backspace, color: Colors.white70),
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  ),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.all(32.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _isConfirmStep ? Padding(
                                  padding: const EdgeInsets.only(right: 32.0),
                                  child: TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _isConfirmStep = false;
                                        _confirmController.clear();
                                      });
                                      pageController.animateToPage(
                                        0,
                                        duration: const Duration(
                                          milliseconds: 100,
                                        ),
                                        curve: Curves.easeIn,
                                      );
                                    },
                                    child: Text(
                                      tr('common.back'),
                                      style: const TextStyle(
                                          color: Colors.white54),
                                    ),
                                  ),
                                ) : Container(),
                    Expanded(
                      child: MainButton(
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                _isConfirmStep
                                    ? tr('common.confirm')
                                    : tr('common.continue'),
                                style: TextStyle(
                                  color: CustomColors.scaffoldDarkBack,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(width: 4.0),
                              Icon(
                                FluentIcons.chevron_right_32_filled,
                                color: CustomColors.scaffoldDarkBack,
                                size: 16.0,
                              ),
                            ],
                          ),
                          onPress: _nextOrSave,
                          isLoading: _loading),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
