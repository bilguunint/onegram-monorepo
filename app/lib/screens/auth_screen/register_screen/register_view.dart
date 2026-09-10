import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/auth_bloc/auth_bloc.dart';
import 'package:onegrgold/bloc/register_bloc/register_bloc.dart';
import 'package:onegrgold/bloc/register_bloc/register_event.dart';
import 'package:onegrgold/bloc/register_bloc/register_state.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:wheel_chooser/wheel_chooser.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({
    super.key,
    required this.authenticationRepository,
    required this.input,
  });
  final AuthRepository authenticationRepository;
  final String input;

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  bool passwordHide = true;
  bool confirmPasswordHide = true;
  PageController pageController = PageController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  List<Map<String, dynamic>> favoriteCategories = [];
  List<Map<String, dynamic>> categories = [];
  int _currentValue = 24;
  double progress = 0;
  bool imageLoader = false;
  List<String> letters = [
    'А',
    'Б',
    'В',
    'Г',
    'Д',
    'Е',
    'Ё',
    'Ж',
    'З',
    'И',
    'Й',
    'К',
    'Л',
    'М',
    'Н',
    'О',
    'Ө',
    'П',
    'Р',
    'С',
    'Т',
    'У',
    'Ү',
    'Ф',
    'Х',
    'Ц',
    'Ч',
    'Ш',
    'Щ',
    'Ъ',
    'Ы',
    'Ь',
    'Э',
    'Ю',
    'Я'
  ];
  String letterA = "А";
  String letterB = "Б";
  final _registerNumberController = TextEditingController();

  static const int _stepCount = 3;

  @override
  void initState() {
    super.initState();
  }

  // Helper: validate name (no numbers, minimum 2 characters)
  bool _isValidName(String name) {
    if (name.trim().length < 2) return false;
    // Allow any characters except numbers
    final nameRegex = RegExp(r'^[^0-9]+$');
    return nameRegex.hasMatch(name.trim());
  }

  // Helper: validate registration number (8 digits)
  bool _isValidRegistrationNumber(String regNum) {
    final digits = regNum.replaceAll(RegExp(r'\D'), '');
    return digits.length == 8;
  }

  // Helper: validate age (between 18 and 80)
  bool _isValidAge(int age) {
    return age >= 18 && age <= 80;
  }

  // Helper: Get current user's phone or email from FirebaseAuth
  String _getCurrentUserPhone() {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser?.phoneNumber != null) {
      // Remove country code +976 if present
      return currentUser!.phoneNumber!.replaceAll('+976', '').replaceAll('+', '');
    }
    return '';
  }

  // Helper: Get current user's email from FirebaseAuth
  String _getCurrentUserEmail() {
    final currentUser = FirebaseAuth.instance.currentUser;
    return currentUser?.email ?? '';
  }

  // Helper: Check if current user signed in with email
  bool _currentUserUsedEmail() {
    final currentUser = FirebaseAuth.instance.currentUser;
    return currentUser?.phoneNumber == null && currentUser?.email != null;
  }

  /// Одоогийн алхам (0..2) — progress утгаас гаргана
  int get _currentStep => (progress / 0.333).round().clamp(0, _stepCount - 1);

  @override
  Widget build(BuildContext context) {
    return BlocListener<RegisterBloc, RegisterState>(
      listener: (context, state) {
        if (state is RegisterFailure) {
          showAlertPopUpDialog(context, state.message, 65);
        }
        if (state is RegisterSuccess) {
          context.read<AuthBloc>().add(RegisterRequested());
        }
      },
      child: BlocBuilder<RegisterBloc, RegisterState>(
        builder: (context, state) {
          return SafeArea(
            child: Column(
              children: [
                _StepIndicator(current: _currentStep, count: _stepCount),
                Expanded(
                  child: PageView(
                    physics: const NeverScrollableScrollPhysics(),
                    controller: pageController,
                    children: [
                      _namePage(context, state),
                      _agePage(context),
                      _nationalIdPage(context, state),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Алхам 1 — Овог, нэр
  // ---------------------------------------------------------------------------
  Widget _namePage(BuildContext context, RegisterState state) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
            children: [
              Text(tr('reg.user_registration'), style: AppText.sectionTitle),
              const SizedBox(height: 12.0),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel(tr('reg.last_name')),
                    const SizedBox(height: 8.0),
                    TextField(
                      keyboardType: TextInputType.text,
                      controller: _lastNameController,
                      onChanged: (text) {
                        setState(() {
                          text;
                        });
                      },
                      style: AppText.body,
                      cursorColor: CustomColors.accent,
                      decoration: appInputDecoration(),
                    ),
                    const SizedBox(height: 16.0),
                    _fieldLabel(tr('reg.first_name')),
                    const SizedBox(height: 8.0),
                    TextField(
                      keyboardType: TextInputType.text,
                      controller: _firstNameController,
                      onChanged: (text) {
                        setState(() {
                          text;
                        });
                      },
                      style: AppText.body,
                      cursorColor: CustomColors.accent,
                      decoration: appInputDecoration(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        _bottomBar(
          child: AppPrimaryButton(
            label: tr('common.continue'),
            icon: Icons.chevron_right_rounded,
            loading: state is RegisterLoading,
            onPressed: () {
              HapticFeedback.lightImpact();
              FocusManager.instance.primaryFocus?.unfocus();

              // Validate both names
              if (_firstNameController.text.trim().isEmpty ||
                  _lastNameController.text.trim().isEmpty) {
                showAlertPopUpDialog(
                  context,
                  tr('reg.fill_all_fields'),
                  65,
                );
                return;
              }

              if (!_isValidName(_firstNameController.text)) {
                showAlertPopUpDialog(
                  context,
                  tr('reg.invalid_first_name'),
                  75,
                );
                return;
              }

              if (!_isValidName(_lastNameController.text)) {
                showAlertPopUpDialog(
                  context,
                  tr('reg.invalid_last_name'),
                  75,
                );
                return;
              }

              setState(() {
                progress = progress + 0.333;
              });
              pageController.animateToPage(
                pageController.page!.toInt() + 1,
                duration: const Duration(
                  milliseconds: 100,
                ),
                curve: Curves.easeIn,
              );
            },
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Алхам 2 — Нас
  // ---------------------------------------------------------------------------
  Widget _agePage(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
            children: [
              Text(tr('reg.age_question'), style: AppText.title),
              const SizedBox(height: 6.0),
              Text(tr('reg.age_hint'), style: AppText.caption),
              const SizedBox(height: 16.0),
              AppCard(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: WheelChooser.integer(
                  onValueChanged: (i) {
                    HapticFeedback.lightImpact();
                    _currentValue = i;
                  },
                  listHeight: 300.0,
                  initValue: _currentValue,
                  magnification: 1.2,
                  perspective: 0.009,
                  unSelectTextStyle: AppText.sectionTitle
                      .copyWith(color: CustomColors.textSecondary),
                  selectTextStyle: AppText.display
                      .copyWith(fontSize: 28.0, color: CustomColors.accent),
                  maxValue: 70,
                  minValue: 18,
                  step: 1,
                ),
              ),
            ],
          ),
        ),
        _bottomBar(
          child: Row(
            children: [
              Expanded(
                child: AppPrimaryButton(
                  label: tr('common.back'),
                  outlined: true,
                  onPressed: () {
                    setState(() {
                      progress = progress - 0.333;
                    });
                    pageController.animateToPage(
                      pageController.page!.toInt() - 1,
                      duration: const Duration(
                        milliseconds: 100,
                      ),
                      curve: Curves.easeIn,
                    );
                  },
                ),
              ),
              const SizedBox(width: 12.0),
              Expanded(
                flex: 2,
                child: AppPrimaryButton(
                  label: tr('common.continue'),
                  icon: Icons.chevron_right_rounded,
                  onPressed: () {
                    HapticFeedback.lightImpact();

                    // Validate age
                    if (!_isValidAge(_currentValue)) {
                      showAlertPopUpDialog(
                        context,
                        tr('reg.age_range_error'),
                        65,
                      );
                      return;
                    }

                    setState(() {
                      progress = progress + 0.333;
                    });
                    pageController.animateToPage(
                      pageController.page!.toInt() + 1,
                      duration: const Duration(
                        milliseconds: 100,
                      ),
                      curve: Curves.easeIn,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Алхам 3 — Регистрийн дугаар
  // ---------------------------------------------------------------------------
  Widget _nationalIdPage(BuildContext context, RegisterState state) {
    final bool regComplete = _registerNumberController.text.length == 8;
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
            children: [
              Text(tr('reg.enter_national_id_title'), style: AppText.title),
              const SizedBox(height: 6.0),
              Text(tr('reg.national_id_hint'), style: AppText.caption),
              const SizedBox(height: 16.0),
              AppCard(
                child: Row(
                  children: [
                    _LetterTile(
                      letter: letterA,
                      onTap: () => _pickLetter(context, (item) {
                        setState(() {
                          letterA = item;
                        });
                      }, letterA),
                    ),
                    const SizedBox(width: 8.0),
                    _LetterTile(
                      letter: letterB,
                      onTap: () => _pickLetter(context, (item) {
                        setState(() {
                          letterB = item;
                        });
                      }, letterB),
                    ),
                    const SizedBox(width: 8.0),
                    Expanded(
                      child: TextField(
                        keyboardType: TextInputType.number,
                        controller: _registerNumberController,
                        maxLength: 8,
                        onChanged: (text) {
                          // Remove any non-digit characters
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
                        style: AppText.bodyBold,
                        cursorColor: CustomColors.accent,
                        decoration: appInputDecoration(
                          hint: "12345678",
                          suffix: regComplete
                              ? Icon(Icons.check_circle_rounded,
                                  size: 20.0, color: CustomColors.positive)
                              : null,
                        ).copyWith(counterText: ""),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        _bottomBar(
          child: AppPrimaryButton(
            label: tr('reg.finish'),
            icon: Icons.check_rounded,
            loading: state is RegisterLoading,
            onPressed: (_registerNumberController.text.trim().isNotEmpty)
                ? () {
                    // Validate registration number format
                    if (!_isValidRegistrationNumber(
                        _registerNumberController.text)) {
                      showAlertPopUpDialog(
                        context,
                        tr('reg.national_id_8_digits'),
                        75,
                      );
                      return;
                    }

                    // Validate letters are selected
                    if (letterA.trim().isEmpty || letterB.trim().isEmpty) {
                      showAlertPopUpDialog(
                        context,
                        tr('reg.select_national_id_letters'),
                        75,
                      );
                      return;
                    }

                    // Get current user's phone or email from Firebase Auth
                    final isEmail = _currentUserUsedEmail();
                    final phoneToSend = isEmail ? '' : _getCurrentUserPhone();
                    final emailToSend = isEmail ? _getCurrentUserEmail() : '';

                    // Final validation of all fields
                    if (_firstNameController.text.trim().isEmpty ||
                        _lastNameController.text.trim().isEmpty ||
                        !_isValidName(_firstNameController.text) ||
                        !_isValidName(_lastNameController.text) ||
                        !_isValidAge(_currentValue)) {
                      showAlertPopUpDialog(
                        context,
                        tr('reg.check_all_fields'),
                        75,
                      );
                      return;
                    }

                    setState(() {
                      progress = progress + 0.333;
                    });
                    HapticFeedback.lightImpact();
                    FocusManager.instance.primaryFocus?.unfocus();

                    context.read<RegisterBloc>().add(
                          RegisterSubmitted(
                            firstName: _firstNameController.text.trim(),
                            lastName: _lastNameController.text.trim(),
                            phoneNumber: phoneToSend,
                            email: emailToSend,
                            registrationNumber: letterA +
                                letterB +
                                _registerNumberController.text.trim(),
                          ),
                        );
                  }
                : null,
          ),
        ),
      ],
    );
  }

  /// Кирилл үсэг сонгох bottom sheet — AppSheet дотор grid
  void _pickLetter(
      BuildContext context, void Function(String) onPicked, String current) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (BuildContext _) {
        return AppSheet(
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 6, // Number of columns
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: letters.length,
            itemBuilder: (context, index) {
              final item = letters[index];
              final bool sel = item == current;
              return GestureDetector(
                onTap: () {
                  onPicked(item);
                  Navigator.pop(context);
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: sel ? CustomColors.accent : CustomColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(10.0),
                  ),
                  child: Center(
                    child: Text(
                      item,
                      style: AppText.bodyBold.copyWith(
                        color: sel ? Colors.black : Colors.white,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _fieldLabel(String text) {
    return Text(
      text,
      style: AppText.label.copyWith(color: CustomColors.textSecondary),
    );
  }

  Widget _bottomBar({required Widget child}) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
        child: child,
      ),
    );
  }
}

/// Алхмын заагч — accent pill (идэвхтэй), surfaceAlt цэг (бусад)
class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current, required this.count});

  final int current;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 8.0),
      child: Row(
        children: List.generate(count, (i) {
          final bool active = i == current;
          final bool done = i < current;
          return Padding(
            padding: EdgeInsets.only(right: i == count - 1 ? 0.0 : 6.0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: active ? 28.0 : 8.0,
              height: 8.0,
              decoration: BoxDecoration(
                color: active || done
                    ? CustomColors.accent
                    : CustomColors.surfaceAlt,
                borderRadius: BorderRadius.circular(4.0),
              ),
            ),
          );
        }),
      ),
    );
  }
}

/// Регистрийн үсгийн дөрвөлжин товч
class _LetterTile extends StatelessWidget {
  const _LetterTile({required this.letter, required this.onTap});

  final String letter;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
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
}
