import 'package:flutter/material.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/user_repository.dart';
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
    setState(() => controller.text = controller.text + value);
  }

  void _onBackspace() {
    final controller = _currentController;
    if (controller.text.isEmpty) return;
    setState(() => controller.text =
        controller.text.substring(0, controller.text.length - 1));
  }

  void _onClear() {
    final controller = _currentController;
    if (controller.text.isEmpty) return;
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
        final isValid = await widget.userRepository.verifyPincode(controller.text);
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
      backgroundColor: CustomColors.scaffoldDarkBack,
      appBar: AppBar(
        backgroundColor: CustomColors.scaffoldDarkBack,
        leading: IconButton(
          onPressed: _onBack,
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _stepTitle,
                    style: const TextStyle(
                      fontSize: 24.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16.0),
                  Text(
                    _stepDescription,
                    style: const TextStyle(
                      fontSize: 16.0,
                      color: Colors.white70,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48.0),
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
                          key: _pinCodeKey,
                          controller: controller,
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
                          onTextChanged: (text) {
                            setState(() {});
                          },
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
          ),
          Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: MainButton(
                        title: Text(
                          _currentStep == 2
                              ? tr('common.save')
                              : tr('common.continue'),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                        onPress: controller.text.length == 6 && !_loading
                            ? _onContinue
                            : null,
                        isLoading: _loading,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16.0),
                NumericKeyboard(
                  onKeyboardTap: _onKeyboardTap,
                  textStyle: const TextStyle(fontSize: 24.0, color: Colors.white),
                  rightButtonFn: _onBackspace,
                  rightButtonLongPressFn: _onClear,
                  rightIcon: const Icon(Icons.backspace, color: Colors.white70),
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                ),
              ],
            ),
          ),
          SizedBox(
            height: 32.0,
          )
        ],
      ),
    );
  }
}
