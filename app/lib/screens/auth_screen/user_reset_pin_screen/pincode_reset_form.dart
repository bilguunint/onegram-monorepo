import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/user_reset_pin_bloc/user_reset_pin_bloc.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';

class PincodeResetForm extends StatefulWidget {
  const PincodeResetForm({
    super.key,
    required this.authenticationRepository,
    required this.input,
  });
  final AuthRepository authenticationRepository;
  /// widget.input = OTP авсан утас/и-мэйл (GenerateSuccess-с ирэх)
  final String input;

  @override
  State<PincodeResetForm> createState() => _PincodeResetFormState();
}

class _PincodeResetFormState extends State<PincodeResetForm> {
  static const int _totalSteps = 4;

  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Step 0 – OTP
  final TextEditingController _otpController = TextEditingController();

  // Step 1 – Регистрийн дугаар
  final TextEditingController _registerNumberController =
      TextEditingController();
  String _letterA = 'А';
  String _letterB = 'Б';

  // Step 2 – Шинэ пинкод
  final TextEditingController _newPinController = TextEditingController();

  // Step 3 – Баталгаажуулах пинкод
  final TextEditingController _confirmPinController = TextEditingController();

  // ---- Алфавит ----
  final List<String> _letters = [
    'А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н',
    'О','Ө','П','Р','С','Т','У','Ү','Ф','Х','Ц','Ч','Ш','Щ','Ъ',
    'Ы','Ь','Э','Ю','Я',
  ];

  // ---- NumericKeyboard handlers (steps 2 & 3) ----
  TextEditingController get _activePinController =>
      _currentStep == 2 ? _newPinController : _confirmPinController;

  void _onKeyboardTap(String value) {
    if (_activePinController.text.length >= 6) return;
    setState(() => _activePinController.text += value);
  }

  void _onBackspace() {
    final c = _activePinController;
    if (c.text.isEmpty) return;
    setState(() => c.text = c.text.substring(0, c.text.length - 1));
  }

  void _onClear() {
    if (_activePinController.text.isEmpty) return;
    setState(() => _activePinController.clear());
  }

  void _showSnackBar(BuildContext ctx, String msg, {bool isError = false}) {
    ScaffoldMessenger.of(ctx).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(color: Colors.white)),
        backgroundColor: isError ? Colors.red.shade700 : Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // ---- Буцах ----
  void _goBack() {
    if (_currentStep == 0) return;
    setState(() => _currentStep--);
    _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
    );
  }

  // ---- Дараагийн / Хадгалах ----
  Future<void> _nextOrSave(BuildContext ctx) async {
    FocusScope.of(context).unfocus();
    switch (_currentStep) {
      case 0:
        if (_otpController.text.length < 4) {
          _showSnackBar(ctx, tr('auth.otp_must_be_4'), isError: true);
          return;
        }
      case 1:
        if (_registerNumberController.text.length != 8) {
          _showSnackBar(ctx, tr('auth.register_must_be_8'), isError: true);
          return;
        }
      case 2:
        if (_newPinController.text.length < 6) {
          _showSnackBar(ctx, tr('auth.pin_must_be_6'), isError: true);
          return;
        }
      case 3:
        if (_confirmPinController.text.length < 6) {
          _showSnackBar(ctx, tr('auth.pin_must_be_6'), isError: true);
          return;
        }
        if (_newPinController.text != _confirmPinController.text) {
          _showSnackBar(ctx, tr('auth.pin_mismatch'), isError: true);
          setState(() => _confirmPinController.clear());
          return;
        }
        final registerNum =
            '$_letterA$_letterB${_registerNumberController.text}';
        ctx.read<UserResetPinBloc>().add(
              UserResetPinPressed(
                registerNum: registerNum,
                newPin: _newPinController.text,
                otpCode: _otpController.text,
                input: widget.input,
              ),
            );
        return;
    }

    // Step 0-2: дараагийн хуудас руу шилж
    setState(() => _currentStep++);
    _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _otpController.dispose();
    _registerNumberController.dispose();
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  // ---- Letter picker bottom sheet ----
  void _showLetterPicker(BuildContext ctx, bool isFirst) {
    final String selected = isFirst ? _letterA : _letterB;
    showModalBottomSheet(
      context: ctx,
      backgroundColor: Colors.transparent,
      builder: (_) => AppSheet(
        child: SizedBox(
          height: 320.0,
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 6,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _letters.length,
            itemBuilder: (_, index) {
              final item = _letters[index];
              final bool isSelected = item == selected;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (isFirst) {
                      _letterA = item;
                    } else {
                      _letterB = item;
                    }
                  });
                  Navigator.pop(ctx);
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected
                        ? CustomColors.accent
                        : CustomColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  child: Center(
                    child: Text(
                      item,
                      style: AppText.bodyBold.copyWith(
                          color: isSelected ? Colors.black : Colors.white),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _letterTile(String letter, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 52.0,
        width: 52.0,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14.0),
          color: CustomColors.surfaceAlt,
        ),
        child: Center(
          child: Text(letter, style: AppText.sectionTitle),
        ),
      ),
    );
  }

  Widget _hiddenPinField(TextEditingController controller) {
    return IgnorePointer(
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
    );
  }

  // ---- Pages ----

  Widget _buildOtpPage() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24.0),
          Text(tr('auth.verification_code'), style: AppText.title),
          const SizedBox(height: 8.0),
          Text(
            tr('auth.otp_sent_to', {'input': widget.input}),
            style: AppText.caption,
          ),
          const SizedBox(height: 32.0),
          Center(
            child: PinCodeTextField(
              autofocus: true,
              controller: _otpController,
              hideCharacter: false,
              isCupertino: true,
              highlightColor: CustomColors.accent,
              defaultBorderColor: CustomColors.surfaceBorder,
              pinBoxColor: CustomColors.surfaceAlt,
              pinBoxRadius: 12.0,
              pinBoxBorderWidth: 1.0,
              hasTextBorderColor: CustomColors.accent,
              errorBorderColor: CustomColors.negative,
              maxLength: 4,
              pinBoxWidth: 52.0,
              pinBoxHeight: 52.0,
              onDone: (text) => setState(() => _otpController.text = text),
              wrapAlignment: WrapAlignment.spaceAround,
              pinBoxDecoration:
                  ProvidedPinBoxDecoration.defaultPinBoxDecoration,
              pinTextStyle: AppText.title.copyWith(fontSize: 20.0),
              pinTextAnimatedSwitcherTransition:
                  ProvidedPinBoxTextAnimation.scalingTransition,
              pinTextAnimatedSwitcherDuration:
                  const Duration(milliseconds: 10),
            ),
          ),
          const SizedBox(height: 24.0),
          Center(
            child: Text(
              tr('auth.otp_not_received'),
              style: AppText.caption,
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterPage(BuildContext ctx) {
    final bool complete = _registerNumberController.text.length == 8;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24.0),
          Text(tr('auth.register_number'), style: AppText.title),
          const SizedBox(height: 8.0),
          Text(tr('auth.register_number_hint'), style: AppText.caption),
          const SizedBox(height: 24.0),
          AppCard(
            child: Row(
              children: [
                _letterTile(_letterA, () => _showLetterPicker(ctx, true)),
                const SizedBox(width: 8.0),
                _letterTile(_letterB, () => _showLetterPicker(ctx, false)),
                const SizedBox(width: 8.0),
                Expanded(
                  child: TextField(
                    keyboardType: TextInputType.number,
                    controller: _registerNumberController,
                    maxLength: 8,
                    onChanged: (text) {
                      final digitsOnly = text.replaceAll(RegExp(r'\D'), '');
                      if (digitsOnly != text) {
                        _registerNumberController.value = TextEditingValue(
                          text: digitsOnly,
                          selection: TextSelection.collapsed(
                              offset: digitsOnly.length),
                        );
                      }
                      setState(() {});
                    },
                    style: AppText.body,
                    cursorColor: CustomColors.accent,
                    decoration: appInputDecoration(
                      hint: '12345678',
                      suffix: complete
                          ? Icon(Icons.check_circle_rounded,
                              size: 18.0, color: CustomColors.positive)
                          : null,
                    ).copyWith(counterText: ''),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNewPinPage() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          tr('auth.enter_new_pin'),
          style: AppText.body,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24.0),
        _hiddenPinField(_newPinController),
      ],
    );
  }

  Widget _buildConfirmPinPage() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          tr('auth.confirm_pin_again'),
          style: AppText.body,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24.0),
        _hiddenPinField(_confirmPinController),
      ],
    );
  }

  @override
  Widget build(BuildContext ctx) {
    final bool isLastStep = _currentStep == _totalSteps - 1;
    final bool showNumericKeyboard = _currentStep >= 2;

    return BlocListener<UserResetPinBloc, UserResetPinState>(
      listener: (context, state) {
        if (state is UserResetPinFailure) {
          _showSnackBar(context, state.msg, isError: true);
        }
        if (state is UserResetPinSuccess) {
          Navigator.of(context).pop();
          _showSnackBar(
            context,
            tr('auth.pin_changed_sign_in'),
          );
           // UserResetPinScreen → EnterPincodeScreen
        }
      },
      child: BlocBuilder<UserResetPinBloc, UserResetPinState>(
        builder: (context, state) {
          return Column(
            children: [
              // ---- Progress bar ----
              Padding(
                padding: const EdgeInsets.fromLTRB(16.0, 4.0, 16.0, 0.0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4.0),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(
                        end: _currentStep / (_totalSteps - 1)),
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.fastLinearToSlowEaseIn,
                    builder: (_, value, __) => LinearProgressIndicator(
                      value: value,
                      minHeight: 6.0,
                      backgroundColor: Colors.white.withOpacity(0.08),
                      valueColor:
                          AlwaysStoppedAnimation<Color>(CustomColors.accent),
                    ),
                  ),
                ),
              ),

              // ---- Pages ----
              Expanded(
                child: PageView(
                  physics: const NeverScrollableScrollPhysics(),
                  controller: _pageController,
                  children: [
                    _buildOtpPage(),
                    _buildRegisterPage(context),
                    _buildNewPinPage(),
                    _buildConfirmPinPage(),
                  ],
                ),
              ),

              // ---- NumericKeyboard (PIN step-үүдэд) ----
              if (showNumericKeyboard) ...[
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
                const SizedBox(height: 16.0),
              ],

              // ---- Bottom buttons ----
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
                  child: Row(
                    children: [
                      if (_currentStep > 0) ...[
                        Expanded(
                          child: AppPrimaryButton(
                            label: tr('common.back'),
                            outlined: true,
                            onPressed:
                                state is UserResetPinLoading ? null : _goBack,
                          ),
                        ),
                        const SizedBox(width: 8.0),
                      ],
                      Expanded(
                        flex: 2,
                        child: AppPrimaryButton(
                          label: isLastStep
                              ? tr('auth.change_pin')
                              : tr('common.continue'),
                          onPressed: () => _nextOrSave(context),
                          loading: state is UserResetPinLoading,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
