import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/style/app_text.dart';
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
      _showErrorDialog(tr('reg.invalid_first_name_format'));
      return;
    }

    if (!_isValidName(_lastNameController.text)) {
      _showErrorDialog(tr('reg.invalid_last_name_format'));
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
          SnackBar(
            content: Text(tr('reg.profile_updated')),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // Return true to indicate success
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

  /// Зөв нэр бичсэн үед оролтын баруун талд ногоон тэмдэг харуулна
  Widget? _validSuffix(String text) {
    if (!_isValidName(text)) return null;
    return Icon(Icons.check_circle_rounded,
        size: 20.0, color: CustomColors.positive);
  }

  @override
  Widget build(BuildContext context) {
    final bool canSave = _isValidName(_firstNameController.text) &&
        _isValidName(_lastNameController.text) &&
        !isLoading;

    return Scaffold(
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('reg.edit_profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
        children: [
          Text(tr('reg.edit_profile_hint'), style: AppText.caption),
          const SizedBox(height: 16.0),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Last Name Field
                Text(tr('reg.last_name'), style: AppText.label),
                const SizedBox(height: 8.0),
                TextField(
                  controller: _lastNameController,
                  style: AppText.body,
                  cursorColor: CustomColors.accent,
                  decoration: appInputDecoration(
                    hint: tr('reg.last_name_placeholder'),
                    suffix: _validSuffix(_lastNameController.text),
                  ),
                  onChanged: (value) => setState(() {}),
                ),
                const SizedBox(height: 12.0),

                // First Name Field
                Text(tr('reg.first_name'), style: AppText.label),
                const SizedBox(height: 8.0),
                TextField(
                  controller: _firstNameController,
                  style: AppText.body,
                  cursorColor: CustomColors.accent,
                  decoration: appInputDecoration(
                    hint: tr('reg.first_name_placeholder'),
                    suffix: _validSuffix(_firstNameController.text),
                  ),
                  onChanged: (value) => setState(() {}),
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
            onPressed: canSave ? _updateProfile : null,
            loading: isLoading,
          ),
        ),
      ),
    );
  }
}
