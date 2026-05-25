import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/repositories/user_repository.dart';
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
      _showErrorDialog('Нэрээ оруулна уу.');
      return;
    }
    
    if (_lastNameController.text.trim().isEmpty) {
      _showErrorDialog('Овогоо оруулна уу.');
      return;
    }
    
    if (!_isValidRegistrationNumber(_registerNumberController.text)) {
      _showErrorDialog('Регистрийн дугаар 8 оронтой тоо байх ёстой.');
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
          const SnackBar(
            content: Text('Мэдээлэл амжилттай шинэчлэгдлээ'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Алдаа гарлаа: $e');
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
        return AlertDialog(
          backgroundColor: CustomColors.darkContainerColor,
          title: const Text(
            'Алдаа',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          content: Text(
            message,
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Ойлголоо',
                style: TextStyle(color: CustomColors.mainColor),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.scaffoldDarkBack,
      appBar: AppBar(
        title: const Text('Регистрийн дугаар шинэчлэх'),
        centerTitle: false,
        backgroundColor: CustomColors.scaffoldDarkBack,
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
                                      padding: const EdgeInsets.only(
                                        left: 16.0,
                                        right: 16.0,
                                        bottom: 8.0,
                                      ),
                                      child: ListView(children: [
                                        const Padding(
                                  padding: EdgeInsets.only(top: 16.0, bottom: 16.0),
                                  child: Column(
                                    children: [
                                      Align(
                                        alignment: Alignment.topLeft,
                                        child: Padding(
                                          padding: EdgeInsets.only(bottom: 8.0),
                                          child: Text(
                                            "Та мэдээллээ оруулна уу.",
                                            style: TextStyle(
                                              fontSize: 20.0,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                      Text(
                                        "Таны нэр, овог, регистрийн дугаараар таныг баталгаажуулах тул үнэн зөв мэдээлэл оруулна уу.",
                                        style: TextStyle(
                                          fontSize: 12.0,
                                          color: Colors.white38,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                        
                                        // Last Name TextField
                                        Padding(
                                          padding: const EdgeInsets.only(bottom: 16.0),
                                          child: TextField(
                                            controller: _lastNameController,
                                            style: const TextStyle(fontSize: 14),
                                            decoration: InputDecoration(
                                              filled: true,
                                              fillColor: CustomColors.inputDarkColor,
                                              labelText: "Овог",
                                              hintText: "Овогоо оруулна уу",
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(color: Colors.white24),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(color: Colors.white38, width: 2),
                                              ),
                                              labelStyle: const TextStyle(fontSize: 12.0, color: Colors.grey),
                                            ),
                                          ),
                                        ),
                                        
                                        // First Name TextField
                                        Padding(
                                          padding: const EdgeInsets.only(bottom: 16.0),
                                          child: TextField(
                                            controller: _firstNameController,
                                            style: const TextStyle(fontSize: 14),
                                            decoration: InputDecoration(
                                              filled: true,
                                              fillColor: CustomColors.inputDarkColor,
                                              labelText: "Нэр",
                                              hintText: "Нэрээ оруулна уу",
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(color: Colors.white24),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(color: Colors.white38, width: 2),
                                              ),
                                              labelStyle: const TextStyle(fontSize: 12.0, color: Colors.grey),
                                            ),
                                          ),
                                        ),
                                        
                                        const Padding(
                                          padding: EdgeInsets.only(top: 8.0, bottom: 8.0),
                                          child: Text(
                                            "Регистрийн дугаар",
                                            style: TextStyle(
                                              fontSize: 14.0,
                                              fontWeight: FontWeight.bold,
                                            ),
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
                                          "Хадгалах",
                                          style: TextStyle(
                                            color:
                                                CustomColors.scaffoldDarkBack,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        SizedBox(width: 4.0),
                                        Icon(
                                          Icons.check,
                                          color: CustomColors.scaffoldDarkBack,
                                          size: 16.0,
                                        ),
                                      ],
                                    ),
                                    onPress: () async {
                                      // Validate first name
                                      if (_firstNameController.text.trim().isEmpty) {
                                        _showErrorDialog('Нэрээ оруулна уу.');
                                        return;
                                      }
                                      
                                      // Validate last name
                                      if (_lastNameController.text.trim().isEmpty) {
                                        _showErrorDialog('Овогоо оруулна уу.');
                                        return;
                                      }
                                      
                                      // Validate registration number format
                                      if (!_isValidRegistrationNumber(_registerNumberController.text)) {
                                        _showErrorDialog('Регистрийн дугаар 8 оронтой тоо байх ёстой.');
                                        return;
                                      }

                                      // Validate letters are selected
                                      if (letterA.trim().isEmpty || letterB.trim().isEmpty) {
                                        _showErrorDialog('Регистрийн дугаарын үсгүүдийг сонгоно уу.');
                                        return;
                                      }

                                      // Update registration number
                                      await _updateRegistrationNumber();
                                    },
                                    isLoading: isLoading,
                                  ),
                                ),
                              ],
                            ),
                          ),
        ],
      ),
    );
  }
}
