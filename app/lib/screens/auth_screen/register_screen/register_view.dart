import 'package:firebase_auth/firebase_auth.dart';
import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/bloc/auth_bloc/auth_bloc.dart';
import 'package:onegrgold/bloc/register_bloc/register_bloc.dart';
import 'package:onegrgold/bloc/register_bloc/register_event.dart';
import 'package:onegrgold/bloc/register_bloc/register_state.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:simple_animation_progress_bar/simple_animation_progress_bar.dart';
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
                SimpleAnimationProgressBar(
                  height: 5,
                  width: MediaQuery.of(context).size.width,
                  backgroundColor: Colors.grey.shade800,
                  ratio: progress,
                  direction: Axis.horizontal,
                  curve: Curves.fastLinearToSlowEaseIn,
                  duration: const Duration(seconds: 3),
                  borderRadius: BorderRadius.circular(10),
                  gradientColor: LinearGradient(
                    colors: [CustomColors.mainColor, CustomColors.mainColor],
                  ),
                  foregrondColor: CustomColors.mainColor,
                ),
                Expanded(
                  child: PageView(
                    physics: const NeverScrollableScrollPhysics(),
                    controller: pageController,
                    children: [
                      Column(
                        children: [
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(
                                left: 16.0,
                                right: 16.0,
                                bottom: 8.0,
                              ),
                              child: ListView(
                                children: [
                                  Align(
                                      alignment: Alignment.topLeft,
                                      child: Padding(
                                        padding: const EdgeInsets.only(
                                            bottom: 8.0, top: 16.0),
                                        child: Text(
                                          tr('reg.user_registration'),
                                          style: const TextStyle(
                                            fontSize: 12.0,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      )),
                                  Align(
                                      alignment: Alignment.topLeft,
                                      child: Padding(
                                        padding: const EdgeInsets.only(
                                            bottom: 8.0, top: 16.0),
                                        child: Text(
                                          tr('reg.last_name'),
                                          style: const TextStyle(
                                            fontSize: 12.0,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      )),
                                  const SizedBox(height: 4.0),
                                  TextField(
                                    keyboardType: TextInputType.text,
                                    controller: _lastNameController,
                                    onChanged: (text) {
                                      setState(() {
                                        text;
                                      });
                                    },
                                    style: const TextStyle(
                                      fontSize: 14.0,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    decoration: InputDecoration(
                                      filled: true,
                                      contentPadding: const EdgeInsets.all(
                                        16.0,
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(
                                          8.0,
                                        ),
                                        borderSide: const BorderSide(
                                          color: Colors.white24,
                                          width: 1.0,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(
                                          8.0,
                                        ),
                                        borderSide: const BorderSide(
                                          color: Colors.white38,
                                          width: 2.0,
                                        ),
                                      ),
                                      hintStyle: TextStyle(
                                        fontSize: 12.0,
                                        color: CustomColors.grey,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      labelStyle: const TextStyle(
                                        fontSize: 12.0,
                                        color: Colors.grey,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16.0),
                                  Align(
                                      alignment: Alignment.topLeft,
                                      child: Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 8.0,
                                        ),
                                        child: Text(
                                          tr('reg.first_name'),
                                          style: const TextStyle(
                                            fontSize: 12.0,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      )),
                                  const SizedBox(height: 4.0),
                                  TextField(
                                    keyboardType: TextInputType.text,
                                    controller: _firstNameController,
                                    onChanged: (text) {
                                      setState(() {
                                        text;
                                      });
                                    },
                                    style: const TextStyle(
                                      fontSize: 14.0,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    decoration: InputDecoration(
                                      filled: true,
                                      contentPadding: const EdgeInsets.all(
                                        16.0,
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(
                                          8.0,
                                        ),
                                        borderSide: const BorderSide(
                                          color: Colors.white24,
                                          width: 1.0,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(
                                          8.0,
                                        ),
                                        borderSide: const BorderSide(
                                          color: Colors.white38,
                                          width: 2.0,
                                        ),
                                      ),
                                      hintStyle: TextStyle(
                                        fontSize: 12.0,
                                        color: CustomColors.grey,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      labelStyle: const TextStyle(
                                        fontSize: 12.0,
                                        color: Colors.grey,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: MainButton(
                                    title: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          tr('common.continue'),
                                          style: TextStyle(
                                            color:
                                                CustomColors.scaffoldDarkBack,
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
                                    onPress: () {
                                      HapticFeedback.lightImpact();
                                      FocusManager.instance.primaryFocus
                                          ?.unfocus();

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
                                    isLoading: state is RegisterLoading,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Align(
                                  alignment: Alignment.topLeft,
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Text(
                                      tr('reg.age_question'),
                                      style: const TextStyle(
                                        fontSize: 20.0,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                Text(
                                  tr('reg.age_hint'),
                                  style: const TextStyle(
                                    fontSize: 12.0,
                                    color: Colors.white38,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          WheelChooser.integer(
                            onValueChanged: (i) {
                              HapticFeedback.lightImpact();
                              _currentValue = i;
                            },
                            listHeight: 300.0,
                            initValue: _currentValue,
                            magnification: 1.2,
                            perspective: 0.009,
                            unSelectTextStyle: const TextStyle(
                              fontSize: 16.0,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            selectTextStyle: TextStyle(
                              fontSize: 25.0,
                              fontWeight: FontWeight.bold,
                              color: CustomColors.mainColor,
                            ),
                            maxValue: 70,
                            minValue: 18,
                            step: 1,
                          ),
                          Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(right: 32.0),
                                  child: TextButton(
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
                                    child: Text(
                                      tr('common.back'),
                                      style: const TextStyle(
                                          color: Colors.white54),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: MainButton(
                                    title: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          tr('common.continue'),
                                          style: TextStyle(
                                            color:
                                                CustomColors.scaffoldDarkBack,
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
                                    onPress: () {
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
                                    isLoading: false,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          Expanded(
                            child: Padding(
                                padding: const EdgeInsets.only(
                                  left: 16.0,
                                  right: 16.0,
                                  bottom: 8.0,
                                ),
                                child: ListView(children: [
                                  Padding(
                            padding: const EdgeInsets.only(
                                top: 16.0, bottom: 16.0),
                            child: Column(
                              children: [
                                Align(
                                  alignment: Alignment.topLeft,
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Text(
                                      tr('reg.enter_national_id_title'),
                                      style: const TextStyle(
                                        fontSize: 20.0,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                Text(
                                  tr('reg.national_id_hint'),
                                  style: const TextStyle(
                                    fontSize: 12.0,
                                    color: Colors.white38,
                                  ),
                                ),
                              ],
                            ),
                          ),
                                  Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () {
                                          showModalBottomSheet(
                                              shape:
                                                  const RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.only(
                                                              topLeft: Radius
                                                                  .circular(
                                                                      8.0),
                                                              topRight: Radius
                                                                  .circular(
                                                                      8.0))),
                                              context: context,
                                              builder: (BuildContext _) {
                                                return Padding(
                                                  padding: const EdgeInsets.all(
                                                      16.0),
                                                  child: GridView.builder(
                                                    gridDelegate:
                                                        const SliverGridDelegateWithFixedCrossAxisCount(
                                                      crossAxisCount:
                                                          6, // Number of columns
                                                      crossAxisSpacing: 10,
                                                      mainAxisSpacing: 10,
                                                    ),
                                                    itemCount: letters.length,
                                                    itemBuilder:
                                                        (context, index) {
                                                      final item =
                                                          letters[index];
                                                      return GestureDetector(
                                                        onTap: () {
                                                          setState(() {
                                                            letterA = item;
                                                          });
                                                          Navigator.pop(
                                                              context);
                                                        },
                                                        child: Container(
                                                          decoration:
                                                              BoxDecoration(
                                                            border: Border.all(
                                                              color: Colors
                                                                  .white12,
                                                              width: 2,
                                                            ),
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        8),
                                                          ),
                                                          child: Center(
                                                            child: Text(item,
                                                                style: TextStyle(
                                                                    fontSize:
                                                                        14,
                                                                    color: CustomColors
                                                                        .textGrey)),
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                );
                                              });
                                        },
                                        child: Container(
                                          height: 47.5,
                                          width: 47.5,
                                          decoration: BoxDecoration(
                                            borderRadius:
                                                BorderRadius.circular(8.0),
                                            color: CustomColors.inputDarkColor,
                                          ),
                                          child: Center(child: Text(letterA)),
                                        ),
                                      ),
                                      const SizedBox(
                                        width: 8.0,
                                      ),
                                      GestureDetector(
                                        onTap: () {
                                          showModalBottomSheet(
                                              shape:
                                                  const RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.only(
                                                              topLeft: Radius
                                                                  .circular(
                                                                      8.0),
                                                              topRight: Radius
                                                                  .circular(
                                                                      8.0))),
                                              context: context,
                                              builder: (BuildContext _) {
                                                return Padding(
                                                  padding: const EdgeInsets.all(
                                                      16.0),
                                                  child: GridView.builder(
                                                    gridDelegate:
                                                        const SliverGridDelegateWithFixedCrossAxisCount(
                                                      crossAxisCount:
                                                          6, // Number of columns
                                                      crossAxisSpacing: 10,
                                                      mainAxisSpacing: 10,
                                                    ),
                                                    itemCount: letters.length,
                                                    itemBuilder:
                                                        (context, index) {
                                                      final item =
                                                          letters[index];
                                                      return GestureDetector(
                                                        onTap: () {
                                                          setState(() {
                                                            letterB = item;
                                                          });
                                                          Navigator.pop(
                                                              context);
                                                        },
                                                        child: Container(
                                                          decoration:
                                                              BoxDecoration(
                                                            border: Border.all(
                                                              color: Colors
                                                                  .white12,
                                                              width: 2,
                                                            ),
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        8),
                                                          ),
                                                          child: Center(
                                                            child: Text(item,
                                                                style: TextStyle(
                                                                    fontSize:
                                                                        14,
                                                                    color: CustomColors
                                                                        .textGrey)),
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                );
                                             });
                                        },
                                        child: Container(
                                          height: 47.5,
                                          width: 47.5,
                                          decoration: BoxDecoration(
                                            borderRadius:
                                                BorderRadius.circular(8.0),
                                            color: CustomColors.inputDarkColor,
                                          ),
                                          child: Center(child: Text(letterB)),
                                        ),
                                      ),
                                      const SizedBox(
                                        width: 8.0,
                                      ),
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
                                                selection: TextSelection.collapsed(offset: digitsOnly.length),
                                              );
                                            }
                                            setState(() {});
                                          },
                                          style: const TextStyle(
                                              fontSize: 14.0,
                                              fontWeight: FontWeight.bold),
                                          decoration: InputDecoration(
                                            filled: true,
                                            counterText: "",
                                            contentPadding:
                                                const EdgeInsets.only(
                                                    left: 10.0, right: 10.0),
                                            hintText: "12345678",
                                            hintStyle: TextStyle(
                                                fontSize: 12.0,
                                                color: CustomColors.grey,
                                                fontWeight: FontWeight.w500),
                                            labelStyle: const TextStyle(
                                                fontSize: 12.0,
                                                color: Colors.grey,
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
                                ])),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: MainButton(
                                    title: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          tr('reg.finish'),
                                          style: TextStyle(
                                            color:
                                                CustomColors.scaffoldDarkBack,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        SizedBox(width: 4.0),
                                        Icon(
                                          FluentIcons.checkmark_24_regular,
                                          color: CustomColors.scaffoldDarkBack,
                                          size: 16.0,
                                        ),
                                      ],
                                    ),
                                    onPress: (_registerNumberController.text.trim().isNotEmpty)
                                        ? () {
                                            // Validate registration number format
                                            if (!_isValidRegistrationNumber(_registerNumberController.text)) {
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
                                    isLoading: state is RegisterLoading,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
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
}
