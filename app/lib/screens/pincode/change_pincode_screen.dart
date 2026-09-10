import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';

class ChangePincodeScreen extends StatefulWidget {
  const ChangePincodeScreen({
    super.key,
    required this.userRepository,
  });

  final UserRepository userRepository;

  @override
  State<ChangePincodeScreen> createState() => _ChangePincodeScreenState();
}

class _ChangePincodeScreenState extends State<ChangePincodeScreen> {
  final _currentPinController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  PageController pageController = PageController();
  bool _loading = false;
  int _currentStep = 0; // 0: current pin, 1: new pin, 2: confirm pin

  // Key to force PinCodeTextField rebuild
  Key _pinCodeKey = UniqueKey();

  void _rebuildPinCodeTextField() {
    setState(() {
      _pinCodeKey = UniqueKey();
    });
  }

  String get _stepTitle {
    switch (_currentStep) {
      case 0:
        return tr('auth.current_pin');
      case 1:
        return tr('auth.new_pin');
      case 2:
        return tr('auth.confirm_pin_title');
      default:
        return '';
    }
  }

  String get _stepDescription {
    switch (_currentStep) {
      case 0:
        return tr('auth.enter_current_pin');
      case 1:
        return tr('auth.enter_new_pin_code');
      case 2:
        return tr('auth.reenter_new_pin');
      default:
        return '';
    }
  }

  TextEditingController get _currentController {
    switch (_currentStep) {
      case 0:
        return _currentPinController;
      case 1:
        return _newController;
      case 2:
        return _confirmController;
      default:
        return _currentPinController;
    }
  }

  void _onKeyboardTap(String value) {
    final controller = _currentController;
    if (controller.text.length >= 6) return;
    HapticFeedback.lightImpact();
    setState(() => controller.text = controller.text + value);
  }

  void _onBackspace() {
    final controller = _currentController;
    if (controller.text.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() => controller.text =
        controller.text.substring(0, controller.text.length - 1));
  }

  void _onClear() {
    final controller = _currentController;
    if (controller.text.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() => controller.text = '');
  }

  TextEditingController _getCurrentController() {
    switch (_currentStep) {
      case 0:
        return _currentPinController;
      case 1:
        return _newController;
      case 2:
        return _confirmController;
      default:
        return _currentPinController;
    }
  }

  Future<void> _onContinue() async {
    final controller = _getCurrentController();

    if (controller.text.length != 6) {
      showAlertPopUpDialog(context, tr('auth.change_pin_must_be_6'), 60);
      return;
    }

    if (_currentStep == 0) {
      // Verify current PIN
      setState(() => _loading = true);
      try {
        final isValid =
            await widget.userRepository.verifyPincode(controller.text);
        if (mounted) {
          if (isValid) {
            setState(() {
              _currentStep = 1;
              _loading = false;
              // Clear the controller for next step and update UI
              _newController.clear();
            });
            _rebuildPinCodeTextField();
          } else {
            setState(() {
              _loading = false;
              // Clear the controller to retry and update UI
              _currentPinController.clear();
            });
            _rebuildPinCodeTextField();
            HapticFeedback.heavyImpact();
            showAlertPopUpDialog(context, tr('auth.current_pin_incorrect'), 60);
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _loading = false;
            // Clear current controller to retry and update UI
            _currentPinController.clear();
          });
          _rebuildPinCodeTextField();
          showAlertPopUpDialog(
              context, tr('common.error_with', {'error': e}), 60);
        }
      }
    } else if (_currentStep == 1) {
      // Move to confirm step
      setState(() {
        _currentStep = 2;
        // Clear the controller for confirm step and update UI
        _confirmController.clear();
      });
      _rebuildPinCodeTextField();
    } else if (_currentStep == 2) {
      // Confirm new PIN and change
      if (_newController.text != _confirmController.text) {
        setState(() {
          // Clear confirm controller to retry and update UI
          _confirmController.clear();
        });
        _rebuildPinCodeTextField();
        showAlertPopUpDialog(context, tr('auth.pin_codes_mismatch'), 60);
        return;
      }

      setState(() => _loading = true);
      try {
        final success = await widget.userRepository.changePincode(
          _currentPinController.text,
          _newController.text,
        );

        if (success) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(tr('auth.pin_changed_success')),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.of(context).pop();
          }
        } else {
          if (mounted) {
            showAlertPopUpDialog(context, tr('auth.pin_change_failed'), 60);
          }
        }
      } catch (e) {
        if (mounted) {
          showAlertPopUpDialog(
              context, tr('common.error_with', {'error': e}), 60);
        }
      } finally {
        if (mounted) {
          setState(() => _loading = false);
        }
      }
    }
  }

  void _onBack() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;

        // Clear appropriate controller when going back and update UI
        if (_currentStep == 0) {
          _currentPinController.clear();
        } else if (_currentStep == 1) {
          _newController.clear();
        }
      });
      _rebuildPinCodeTextField();
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _currentPinController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _getCurrentController();

    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      // appBar() helper has no `leading` slot; this mirrors its styling while
      // keeping the step-aware back handler.
      appBar: AppBar(
        backgroundColor: CustomColors.appBackground,
        surfaceTintColor: Colors.transparent,
        elevation: 0.0,
        scrolledUnderElevation: 0.0,
        iconTheme: const IconThemeData(color: Colors.white),
        centerTitle: false,
        leading: IconButton(
          onPressed: _onBack,
          icon: const Icon(Icons.arrow_back),
        ),
        title: Text(tr('auth.change_pin'), style: AppText.appBarTitle),
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AppIconTile(
                    size: 64.0,
                    child: Icon(Icons.lock_rounded,
                        size: 30.0, color: CustomColors.accent),
                  ),
                  const SizedBox(height: 20.0),
                  Text(
                    _stepTitle,
                    style: AppText.title,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8.0),
                  Text(
                    _stepDescription,
                    style: AppText.caption,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32.0),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        tr('auth.enter_your_pin'),
                        style: AppText.body,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20.0),
                      IgnorePointer(
                        ignoring: true,
                        child: PinCodeTextField(
                          key: _pinCodeKey,
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
                          onTextChanged: (text) {
                            setState(() {});
                          },
                          wrapAlignment: WrapAlignment.spaceAround,
                          pinBoxDecoration:
                              ProvidedPinBoxDecoration.defaultPinBoxDecoration,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: NumericKeyboard(
              onKeyboardTap: _onKeyboardTap,
              textStyle: AppText.title.copyWith(fontSize: 26.0),
              rightButtonFn: _onBackspace,
              rightButtonLongPressFn: _onClear,
              rightIcon: Icon(Icons.backspace_outlined,
                  color: CustomColors.textSecondary),
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
            ),
          ),
          const SizedBox(height: 8.0),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
          child: AppPrimaryButton(
            label: _currentStep == 2 ? tr('common.save') : tr('common.continue'),
            onPressed: controller.text.length == 6 && !_loading
                ? _onContinue
                : null,
            loading: _loading,
          ),
        ),
      ),
    );
  }
}
