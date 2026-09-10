import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/main_screen.dart';
import 'package:onegrgold/style/app_text.dart';
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
    HapticFeedback.lightImpact();
    setState(() => controller.text = controller.text + value);
  }

  void _onBackspace() {
    final controller = _isConfirmStep ? _confirmController : _firstController;
    if (controller.text.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() => controller.text =
        controller.text.substring(0, controller.text.length - 1));
  }

  void _onClear() {
    final controller = _isConfirmStep ? _confirmController : _firstController;
    if (controller.text.isEmpty) return;
    HapticFeedback.mediumImpact();
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
      HapticFeedback.heavyImpact();
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

  void _goBack() {
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
  }

  Widget _pinStep(String prompt, TextEditingController controller) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          prompt,
          style: AppText.body,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20.0),
        IgnorePointer(
          ignoring: true,
          child: PinCodeTextField(
            controller: controller,
            maxLength: 6,
            autofocus: false,
            isCupertino: true,
            hideCharacter: true,
            highlightColor: CustomColors.accent,
            defaultBorderColor: CustomColors.surfaceBorder,
            pinBoxColor: CustomColors.surfaceAlt,
            pinBoxRadius: 12.0,
            pinBoxBorderWidth: 1.0,
            hasTextBorderColor: CustomColors.accent,
            errorBorderColor: CustomColors.negative,
            pinBoxWidth: 44.0,
            pinBoxHeight: 44.0,
            pinTextStyle: AppText.title.copyWith(fontSize: 20.0),
            onDone: (_) {},
            wrapAlignment: WrapAlignment.spaceAround,
            pinBoxDecoration: ProvidedPinBoxDecoration.defaultPinBoxDecoration,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar(tr('auth.user_pin_title')),
      backgroundColor: CustomColors.appBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 0.0),
                child: Text(
                  tr('auth.set_pin_intro'),
                  style: AppText.caption,
                  textAlign: TextAlign.center,
                ),
              ),
              Expanded(
                child: PageView(
                  physics: const NeverScrollableScrollPhysics(),
                  controller: pageController,
                  children: [
                    _pinStep(tr('auth.enter_your_pin'), _firstController),
                    _pinStep(tr('auth.reenter_your_pin_confirm'),
                        _confirmController),
                  ],
                ),
              ),
              NumericKeyboard(
                onKeyboardTap: _onKeyboardTap,
                textStyle: AppText.title.copyWith(fontSize: 26.0),
                rightButtonFn: _onBackspace,
                rightButtonLongPressFn: _onClear,
                rightIcon: Icon(Icons.backspace_outlined,
                    color: CustomColors.textSecondary),
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
              ),
              const SizedBox(height: 8.0),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
          child: Row(
            children: [
              if (_isConfirmStep) ...[
                Expanded(
                  child: AppPrimaryButton(
                    label: tr('common.back'),
                    outlined: true,
                    onPressed: _loading ? null : _goBack,
                  ),
                ),
                const SizedBox(width: 8.0),
              ],
              Expanded(
                flex: 2,
                child: AppPrimaryButton(
                  label: _isConfirmStep
                      ? tr('common.confirm')
                      : tr('common.continue'),
                  onPressed: _nextOrSave,
                  loading: _loading,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
