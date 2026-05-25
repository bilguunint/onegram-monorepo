import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/user_reset_pin_bloc/user_reset_pin_bloc.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:simple_animation_progress_bar/simple_animation_progress_bar.dart';

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
          _showSnackBar(ctx, 'OTP код 4 оронтой байх ёстой', isError: true);
          return;
        }
      case 1:
        if (_registerNumberController.text.length != 8) {
          _showSnackBar(ctx, 'Регистрийн дугаар 8 оронтой байх ёстой', isError: true);
          return;
        }
      case 2:
        if (_newPinController.text.length < 6) {
          _showSnackBar(ctx, 'Пинкод 6 оронтой байх ёстой', isError: true);
          return;
        }
      case 3:
        if (_confirmPinController.text.length < 6) {
          _showSnackBar(ctx, 'Пинкод 6 оронтой байх ёстой', isError: true);
          return;
        }
        if (_newPinController.text != _confirmPinController.text) {
          _showSnackBar(ctx, 'Пинкод таарахгүй байна', isError: true);
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
    showModalBottomSheet(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(12.0),
          topRight: Radius.circular(12.0),
        ),
      ),
      context: ctx,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 6,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _letters.length,
          itemBuilder: (_, index) {
            final item = _letters[index];
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
                  border: Border.all(color: Colors.white12, width: 2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    item,
                    style: TextStyle(fontSize: 14, color: CustomColors.textGrey),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ---- Pages ----

  Widget _buildOtpPage() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24.0),
          const Text(
            'Баталгаажуулах код',
            style: TextStyle(fontSize: 20.0, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8.0),
          Text(
            'Бид таны ${widget.input} дугаарт баталгаажуулах код илгээлээ. Кодоо оруулна уу.',
            style: const TextStyle(fontSize: 13.0, color: Colors.white60),
          ),
          const SizedBox(height: 32.0),
          Center(
            child: PinCodeTextField(
              autofocus: true,
              controller: _otpController,
              hideCharacter: false,
              isCupertino: true,
              highlightColor: CustomColors.mainColor,
              defaultBorderColor: Colors.white12,
              pinBoxColor: CustomColors.inputDarkColor,
              pinBoxRadius: 6.0,
              hasTextBorderColor: CustomColors.mainColor,
              maxLength: 4,
              pinBoxWidth: 45.0,
              pinBoxHeight: 45.0,
              onDone: (text) => setState(() => _otpController.text = text),
              wrapAlignment: WrapAlignment.spaceAround,
              pinBoxDecoration:
                  ProvidedPinBoxDecoration.defaultPinBoxDecoration,
              pinTextStyle: const TextStyle(
                fontSize: 18.0,
                fontWeight: FontWeight.bold,
              ),
              pinTextAnimatedSwitcherTransition:
                  ProvidedPinBoxTextAnimation.scalingTransition,
              pinTextAnimatedSwitcherDuration:
                  const Duration(milliseconds: 10),
            ),
          ),
          const SizedBox(height: 24.0),
          const Center(
            child: Text(
              'OTP код ирээгүй юу? Код дахин авах',
              style: TextStyle(fontSize: 13.0, color: Colors.white54),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterPage(BuildContext ctx) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24.0),
          const Text(
            'Регистрийн дугаар',
            style: TextStyle(fontSize: 20.0, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8.0),
          const Text(
            'Таны регистрийн дугаараар таныг баталгаажуулах тул үнэн зөв оруулна уу.',
            style: TextStyle(fontSize: 13.0, color: Colors.white38),
          ),
          const SizedBox(height: 24.0),
          Row(
            children: [
              GestureDetector(
                onTap: () => _showLetterPicker(ctx, true),
                child: Container(
                  height: 50.0,
                  width: 50.0,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8.0),
                    color: CustomColors.inputDarkColor,
                  ),
                  child: Center(
                    child: Text(_letterA,
                        style: const TextStyle(
                            fontSize: 16.0, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
              const SizedBox(width: 8.0),
              GestureDetector(
                onTap: () => _showLetterPicker(ctx, false),
                child: Container(
                  height: 50.0,
                  width: 50.0,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8.0),
                    color: CustomColors.inputDarkColor,
                  ),
                  child: Center(
                    child: Text(_letterB,
                        style: const TextStyle(
                            fontSize: 16.0, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
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
                  style: const TextStyle(
                      fontSize: 14.0, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    filled: true,
                    counterText: '',
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12.0),
                    hintText: '12345678',
                    hintStyle: TextStyle(
                        fontSize: 13.0,
                        color: CustomColors.grey,
                        fontWeight: FontWeight.w500),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8.0),
                      borderSide: BorderSide(
                        color: _registerNumberController.text.length == 8
                            ? Colors.green.withOpacity(0.5)
                            : Colors.white24,
                        width: 1.0,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8.0),
                      borderSide: BorderSide(
                        color: _registerNumberController.text.length == 8
                            ? Colors.green
                            : Colors.white38,
                        width: 2.0,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNewPinPage() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          'Шинэ пинкодоо оруулна уу',
          style: TextStyle(fontSize: 14.0, color: Colors.white70),
        ),
        const SizedBox(height: 24.0),
        IgnorePointer(
          ignoring: true,
          child: PinCodeTextField(
            controller: _newPinController,
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
            pinBoxWidth: 44.0,
            pinBoxHeight: 44.0,
            onDone: (_) {},
            wrapAlignment: WrapAlignment.spaceAround,
            pinBoxDecoration:
                ProvidedPinBoxDecoration.defaultPinBoxDecoration,
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmPinPage() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          'Пинкодоо дахин оруулж баталгаажуулна уу',
          style: TextStyle(fontSize: 14.0, color: Colors.white70),
        ),
        const SizedBox(height: 24.0),
        IgnorePointer(
          ignoring: true,
          child: PinCodeTextField(
            controller: _confirmPinController,
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
            pinBoxWidth: 44.0,
            pinBoxHeight: 44.0,
            onDone: (_) {},
            wrapAlignment: WrapAlignment.spaceAround,
            pinBoxDecoration:
                ProvidedPinBoxDecoration.defaultPinBoxDecoration,
          ),
        ),
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
            'Пинкод амжилттай солигдлоо. Шинэ пинкодоороо нэвтэрнэ үү.',
          );
           // UserResetPinScreen → EnterPincodeScreen
        }
      },
      child: BlocBuilder<UserResetPinBloc, UserResetPinState>(
        builder: (context, state) {
          return Column(
            children: [
              // ---- Progress bar ----
              SimpleAnimationProgressBar(
                height: 5,
                width: MediaQuery.of(context).size.width,
                backgroundColor: Colors.grey.shade800,
                ratio: _currentStep / (_totalSteps - 1),
                direction: Axis.horizontal,
                curve: Curves.fastLinearToSlowEaseIn,
                duration: const Duration(milliseconds: 300),
                borderRadius: BorderRadius.circular(10),
                gradientColor: LinearGradient(
                  colors: [CustomColors.mainColor, CustomColors.mainColor],
                ),
                foregrondColor: CustomColors.mainColor,
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
                    textStyle:
                        const TextStyle(fontSize: 24.0, color: Colors.white),
                    rightButtonFn: _onBackspace,
                    rightButtonLongPressFn: _onClear,
                    rightIcon:
                        const Icon(Icons.backspace, color: Colors.white70),
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  ),
                ),
                const SizedBox(height: 32.0),
              ],

              // ---- Bottom buttons ----
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24.0, 12.0, 24.0, 16.0),
                  child: Row(
                    children: [
                      if (_currentStep > 0) ...[
                        TextButton(
                          onPressed: _goBack,
                          child: const Text(
                            'Буцах',
                            style: TextStyle(color: Colors.white54),
                          ),
                        ),
                        const SizedBox(width: 12.0),
                      ],
                      Expanded(
                        child: MainButton(
                          title: Text(
                            isLastStep ? 'Пинкод солих' : 'Үргэлжлүүлэх',
                            style: TextStyle(
                              color: CustomColors.scaffoldDarkBack,
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                            ),
                          ),
                          onPress: () => _nextOrSave(context),
                          isLoading: state is UserResetPinLoading,
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

