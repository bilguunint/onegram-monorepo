import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

class UpdateRegistrationScreen extends StatefulWidget {
  const UpdateRegistrationScreen({
    super.key,
    required this.userRepository,
    required this.user,
  });

  final UserRepository userRepository;
  final UserModel user;

  @override
  State<UpdateRegistrationScreen> createState() => _UpdateRegistrationScreenState();
}

class _UpdateRegistrationScreenState extends State<UpdateRegistrationScreen> {
  bool isLoading = false;
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
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Pre-fill with existing data
    _firstNameController.text = widget.user.firstName;
    _lastNameController.text = widget.user.lastName;

    if (widget.user.registrationNumber.isNotEmpty && widget.user.registrationNumber.length >= 10) {
      // Extract letters and digits from existing registration number (format: АБ12345678)
      letterA = widget.user.registrationNumber.substring(0, 1);
      letterB = widget.user.registrationNumber.substring(1, 2);
      _registerNumberController.text = widget.user.registrationNumber.substring(2);
    }
  }

  @override
  void dispose() {
    _registerNumberController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  // Helper: validate registration number (8 digits)
  bool _isValidRegistrationNumber(String regNum) {
    final digits = regNum.replaceAll(RegExp(r'\D'), '');
    return digits.length == 8;
  }

  Future<void> _updateRegistrationNumber() async {
    // Validate all fields
    if (_firstNameController.text.trim().isEmpty) {
      _showErrorDialog(tr('reg.enter_first_name_error'));
      return;
    }

    if (_lastNameController.text.trim().isEmpty) {
      _showErrorDialog(tr('reg.enter_last_name_error'));
      return;
    }

    if (!_isValidRegistrationNumber(_registerNumberController.text)) {
      _showErrorDialog(tr('reg.national_id_8_digits'));
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      // Combine letters and numbers to create full registration number
      final fullRegistrationNumber = letterA + letterB + _registerNumberController.text.trim();

      // Update all fields in Firestore
      await FirebaseFirestore.instance
          .collection('users')
          .doc(widget.user.uid)
          .update({
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'registration_number': fullRegistrationNumber,
      });

      if (mounted) {
        // Show success message and go back
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr('reg.info_updated')),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog(tr('common.error_with', {'error': e}));
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AppDialog(
          icon: Icons.error_outline_rounded,
          iconColor: CustomColors.negative,
          title: tr('reg.error_title'),
          message: message,
          primaryLabel: tr('reg.got_it'),
          onPrimary: () => Navigator.of(context).pop(),
        );
      },
    );
  }

  Future<void> _onSavePressed() async {
    // Validate first name
    if (_firstNameController.text.trim().isEmpty) {
      _showErrorDialog(tr('reg.enter_first_name_error'));
      return;
    }

    // Validate last name
    if (_lastNameController.text.trim().isEmpty) {
      _showErrorDialog(tr('reg.enter_last_name_error'));
      return;
    }

    // Validate registration number format
    if (!_isValidRegistrationNumber(_registerNumberController.text)) {
      _showErrorDialog(tr('reg.national_id_8_digits'));
      return;
    }

    // Validate letters are selected
    if (letterA.trim().isEmpty || letterB.trim().isEmpty) {
      _showErrorDialog(tr('reg.select_national_id_letters'));
      return;
    }

    // Update registration number
    await _updateRegistrationNumber();
  }

  /// Регистрийн үсэг сонгох sheet — сонгосон үсэг accent дэвсгэртэй
  void _showLetterPicker({
    required String selected,
    required ValueChanged<String> onPick,
  }) {
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
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: letters.length,
            itemBuilder: (context, index) {
              final item = letters[index];
              final bool isSelected = item == selected;
              return GestureDetector(
                onTap: () {
                  onPick(item);
                  Navigator.pop(context);
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
                      style: isSelected
                          ? AppText.bodyBold.copyWith(color: Colors.black)
                          : AppText.body,
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

  Widget _letterTile(String letter, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14.0),
      child: Container(
        height: 52.0,
        width: 52.0,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14.0),
          color: CustomColors.surfaceAlt,
        ),
        child: Center(child: Text(letter, style: AppText.bodyBold)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool regValid = _registerNumberController.text.length == 8;

    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('reg.update_national_id')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
        children: [
          Text(tr('reg.enter_your_info'), style: AppText.sectionTitle),
          const SizedBox(height: 6.0),
          Text(tr('reg.verify_info_hint'), style: AppText.caption),
          const SizedBox(height: 16.0),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Last Name TextField
                TextField(
                  controller: _lastNameController,
                  style: AppText.body,
                  cursorColor: CustomColors.accent,
                  decoration: appInputDecoration(
                    label: tr('reg.last_name'),
                    hint: tr('reg.last_name_hint'),
                  ),
                ),
                const SizedBox(height: 12.0),

                // First Name TextField
                TextField(
                  controller: _firstNameController,
                  style: AppText.body,
                  cursorColor: CustomColors.accent,
                  decoration: appInputDecoration(
                    label: tr('reg.first_name'),
                    hint: tr('reg.first_name_hint'),
                  ),
                ),
                const SizedBox(height: 16.0),

                Text(tr('reg.national_id'), style: AppText.label),
                const SizedBox(height: 8.0),
                Row(
                  children: [
                    _letterTile(
                      letterA,
                      () => _showLetterPicker(
                        selected: letterA,
                        onPick: (item) => setState(() {
                          letterA = item;
                        }),
                      ),
                    ),
                    const SizedBox(width: 8.0),
                    _letterTile(
                      letterB,
                      () => _showLetterPicker(
                        selected: letterB,
                        onPick: (item) => setState(() {
                          letterB = item;
                        }),
                      ),
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
                              selection: TextSelection.collapsed(offset: digitsOnly.length),
                            );
                          }
                          setState(() {});
                        },
                        style: AppText.bodyBold,
                        cursorColor: CustomColors.accent,
                        decoration: appInputDecoration(
                          hint: "12345678",
                          suffix: regValid
                              ? Icon(Icons.check_circle_rounded,
                                  size: 20.0, color: CustomColors.positive)
                              : null,
                        ).copyWith(counterText: ""),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
          child: AppPrimaryButton(
            label: tr('common.save'),
            icon: Icons.check,
            onPressed: _onSavePressed,
            loading: isLoading,
          ),
        ),
      ),
    );
  }
}
