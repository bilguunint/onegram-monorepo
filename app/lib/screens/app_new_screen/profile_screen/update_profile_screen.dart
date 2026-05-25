import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/style/colors.dart';

class UpdateProfileScreen extends StatefulWidget {
  const UpdateProfileScreen({
    super.key,
    required this.user,
  });

  final UserModel user;

  @override
  State<UpdateProfileScreen> createState() => _UpdateProfileScreenState();
}

class _UpdateProfileScreenState extends State<UpdateProfileScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill with existing names
    _firstNameController.text = widget.user.firstName;
    _lastNameController.text = widget.user.lastName;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  // Helper: validate name (only letters and spaces)
  bool _isValidName(String name) {
    final nameRegex = RegExp(r'^[a-zA-ZА-Яа-яӨөҮү\s]+$');
    return name.trim().isNotEmpty && nameRegex.hasMatch(name.trim());
  }

  Future<void> _updateProfile() async {
    if (!_isValidName(_firstNameController.text)) {
      _showErrorDialog('Нэр зөв форматтай байх ёстой.');
      return;
    }

    if (!_isValidName(_lastNameController.text)) {
      _showErrorDialog('Овог зөв форматтай байх ёстой.');
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      // Update names in Firestore
      await FirebaseFirestore.instance
          .collection('users')
          .doc(widget.user.uid)
          .update({
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
      });

      if (mounted) {
        // Show success message and go back
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Бүртгэл амжилттай шинэчлэгдлээ'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // Return true to indicate success
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
        title: const Text('Бүртгэл засах'),
        centerTitle: false,
        backgroundColor: CustomColors.scaffoldDarkBack,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Та өөрийн нэр, овгийг шинэчлэх боломжтой.',
              style: TextStyle(
                fontSize: 14.0,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 32.0),
            
            // Last Name Field
            const Text(
              'Овог',
              style: TextStyle(
                fontSize: 16.0,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8.0),
            TextField(
              controller: _lastNameController,
              style: const TextStyle(
                fontSize: 16.0,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
              decoration: InputDecoration(
                filled: true,
                fillColor: CustomColors.inputDarkColor,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                hintText: "Овог оруулна уу",
                hintStyle: TextStyle(
                  fontSize: 14.0,
                  color: CustomColors.grey,
                  fontWeight: FontWeight.w400,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(
                    color: _isValidName(_lastNameController.text) 
                        ? Colors.green.withOpacity(0.5)
                        : Colors.white24,
                    width: 1.0,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(
                    color: _isValidName(_lastNameController.text) 
                        ? Colors.green
                        : Colors.white38,
                    width: 2.0,
                  ),
                ),
              ),
              onChanged: (value) => setState(() {}),
            ),
            
            const SizedBox(height: 24.0),
            
            // First Name Field
            const Text(
              'Нэр',
              style: TextStyle(
                fontSize: 16.0,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8.0),
            TextField(
              controller: _firstNameController,
              style: const TextStyle(
                fontSize: 16.0,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
              decoration: InputDecoration(
                filled: true,
                fillColor: CustomColors.inputDarkColor,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                hintText: "Нэр оруулна уу",
                hintStyle: TextStyle(
                  fontSize: 14.0,
                  color: CustomColors.grey,
                  fontWeight: FontWeight.w400,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(
                    color: _isValidName(_firstNameController.text) 
                        ? Colors.green.withOpacity(0.5)
                        : Colors.white24,
                    width: 1.0,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(
                    color: _isValidName(_firstNameController.text) 
                        ? Colors.green
                        : Colors.white38,
                    width: 2.0,
                  ),
                ),
              ),
              onChanged: (value) => setState(() {}),
            ),
            
            const Spacer(),
            
            SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: MainButton(
                      title: const Text(
                        "Хадгалах",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      onPress: (_isValidName(_firstNameController.text) && 
                                _isValidName(_lastNameController.text) && 
                                !isLoading)
                          ? _updateProfile
                          : null,
                      isLoading: isLoading,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
