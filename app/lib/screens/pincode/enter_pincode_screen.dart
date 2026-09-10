import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:onegrgold/bloc/auth_bloc/auth_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/l10n/language_switcher.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/main_screen.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/generate_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/screens/auth_screen/user_reset_pin_screen/user_reset_pin_screen.dart';

class EnterPincodeScreen extends StatefulWidget {
  const EnterPincodeScreen({
    super.key,
    required this.userRepository,
    required this.authRepository,
    required this.uid,
  });

  final UserRepository userRepository;
  final AuthRepository authRepository;
  final String uid;

  @override
  State<EnterPincodeScreen> createState() => _EnterPincodeScreenState();
}

class _EnterPincodeScreenState extends State<EnterPincodeScreen> {
  final _codeController = TextEditingController();
  bool _loading = false;
  late Future<UserModel> _userFuture;

  @override
  void initState() {
    super.initState();
    _userFuture = _fetchUser();
  }

  void _showForgotPinDialog() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => UserResetPinScreen(
          authenticationRepository: widget.authRepository,
        ),
      ),
    );
  }

  Future<UserModel> _fetchUser() async {
    try {
      final doc = await widget.userRepository.firestore
          .collection('users')
          .doc(widget.uid)
          .get();
      final data = doc.data();
      if (doc.exists && data != null) {
        return UserModel.fromMap(doc.id, data);
      }
    } catch (_) {}
    return UserModel.empty;
  }

  String _formatGreeting(UserModel u) {
    final ln = (u.lastName).trim();
    final fn = (u.firstName).trim();
    final initial = ln.isNotEmpty ? ln[0] : '';
    if (initial.isEmpty && fn.isEmpty) return '';
    return tr('auth.greeting',
        {'name': '${initial.isNotEmpty ? '$initial. ' : ''}$fn'});
  }

  void _onKeyboardTap(String value) {
    if (_codeController.text.length >= 6) return;
    HapticFeedback.lightImpact();
    setState(() => _codeController.text = _codeController.text + value);
    if (_codeController.text.length == 6) {
      _verify();
    }
  }

  void _onBackspace() {
    if (_codeController.text.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() => _codeController.text =
        _codeController.text.substring(0, _codeController.text.length - 1));
  }

  void _onClear() {
    if (_codeController.text.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() => _codeController.text = '');
  }

  Future<void> _verify() async {
    if (_codeController.text.length != 6) return; // ensure 6 digits
    setState(() {
      _loading = true;
    });
    final isValid =
        await widget.userRepository.verifyPincode(_codeController.text);
    if (!mounted) return;
    setState(() {
      _loading = false;
    });
    if (isValid) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => MainScreen(
            userRepository: widget.userRepository,
            authRepository: widget.authRepository,
            uid: widget.uid,
          ),
        ),
      );
    } else {
      HapticFeedback.heavyImpact();
      showAlertPopUpDialog(context, tr('auth.pin_incorrect'), 75.0);
      _codeController.text = '';
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      body: SafeArea(
        child: Stack(
          children: [
            // Language switcher floated over the top-right corner so the
            // centred PIN layout below is untouched.
            const Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: EdgeInsets.only(top: 4, right: 16),
                child: LanguageSwitcherButton(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 70.0,
                    child:
                        Image.asset('assets/images/logo_white_horizontal.png'),
                  ),
                  const SizedBox(height: 20.0),
                  FutureBuilder<UserModel>(
                    future: _userFuture,
                    builder: (context, snapshot) {
                      final user = snapshot.data ?? UserModel.empty;
                      final text = _formatGreeting(user);
                      if (text.isEmpty) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          text,
                          style: AppText.title,
                          textAlign: TextAlign.center,
                        ),
                      );
                    },
                  ),
                  Text(
                    tr('auth.enter_your_pin'),
                    style: AppText.caption,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24.0),
                  IgnorePointer(
                    ignoring: true, // prevent opening system keyboard
                    child: PinCodeTextField(
                      controller: _codeController,
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
                      onDone: (text) {
                        // handled by on-screen keyboard
                      },
                      wrapAlignment: WrapAlignment.spaceAround,
                      pinBoxDecoration:
                          ProvidedPinBoxDecoration.defaultPinBoxDecoration,
                    ),
                  ),
                  const SizedBox(height: 12.0),
                  TextButton(
                      onPressed: _showForgotPinDialog,
                      child: Text(
                        tr('auth.forgot_pin'),
                        style: AppText.link,
                      )),
                  const SizedBox(height: 8.0),
                  NumericKeyboard(
                    onKeyboardTap: _onKeyboardTap,
                    textStyle: AppText.title.copyWith(fontSize: 26.0),
                    rightButtonFn: _onBackspace,
                    rightButtonLongPressFn: _onClear,
                    rightIcon: Icon(Icons.backspace_outlined,
                        color: CustomColors.textSecondary),
                    leftButtonFn: _verify,
                    leftIcon: _loading
                        ? const CupertinoActivityIndicator(
                            color: Colors.white,
                          )
                        : Icon(Icons.lock_open_rounded,
                            color: CustomColors.accent),
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  ),
                  const SizedBox(height: 16.0),
                  const AppDivider(vertical: 0.0),
                  const SizedBox(height: 12.0),
                  TextButton(
                      onPressed: () {
                        // Logout and navigate to GenerateScreen
                        context.read<AuthBloc>().add(LoggedOut());
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(
                            builder: (_) => GenerateScreen(
                                authenticationRepository:
                                    widget.authRepository),
                          ),
                          (route) => false,
                        );
                      },
                      child: Text(
                        tr('auth.sign_in_other_user'),
                        style: AppText.link
                            .copyWith(color: CustomColors.textSecondary),
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
