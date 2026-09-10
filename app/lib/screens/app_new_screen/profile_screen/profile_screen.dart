import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/l10n/language_switcher.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../bloc/auth_bloc/auth_bloc.dart';
import '../../../repositories/user_repository.dart';
import '../../../style/colors.dart';
import '../../../models/user_model.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/screens/app_new_screen/profile_screen/update_profile_screen.dart';
import 'package:onegrgold/screens/pincode/change_pincode_screen.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/generate_screen.dart';
import 'package:onegrgold/repositories/auth_repository.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.userRepository,
  });
  final UserRepository userRepository;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserModel? currentUser;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final authState = context.read<AuthBloc>().state;
      if (authState is AuthAuthenticated) {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(authState.uid)
            .get();

        if (doc.exists) {
          final user = UserModel.fromMap(authState.uid, doc.data()!);
          setState(() {
            currentUser = user;
            isLoading = false;
          });
        } else {
          setState(() {
            isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _openEditProfile() async {
    if (currentUser != null) {
      final result = await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => UpdateProfileScreen(user: currentUser!),
        ),
      );
      // Refresh user data after update
      if (result == true) {
        _loadUserData();
      }
    }
  }

  void _openChangePincode() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ChangePincodeScreen(
          userRepository: widget.userRepository,
        ),
      ),
    );
  }

  void _confirmSignOut() {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AppDialog(
          icon: Icons.logout_rounded,
          danger: true,
          title: tr('reg.sign_out_title'),
          message: tr('reg.sign_out_confirm'),
          secondaryLabel: tr('reg.no'),
          onSecondary: () => Navigator.pop(dialogContext),
          primaryLabel: tr('reg.yes'),
          onPrimary: () {
            Navigator.pop(dialogContext);
            // Dispatch logout; listener above will navigate
            context.read<AuthBloc>().add(LoggedOut());
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          // Clear navigation stack and go to GenerateScreen when logged out
          final authRepo = context.read<AuthRepository>();
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => GenerateScreen(authenticationRepository: authRepo),
            ),
            (route) => false,
          );
        }
      },
      child: Scaffold(
        backgroundColor: CustomColors.appBackground,
        appBar: appBar(tr('nav.profile')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
          children: [
            _buildHeader(),
            const SizedBox(height: 20.0),
            AppCard(
              padding: const EdgeInsets.symmetric(
                  horizontal: 16.0, vertical: 6.0),
              child: Column(
                children: [
                  AppListRow(
                    title: tr('reg.edit_profile'),
                    leading: const AppIconTile(
                      size: 40.0,
                      child: Icon(Icons.edit_outlined,
                          size: 20.0, color: Colors.white),
                    ),
                    onTap: _openEditProfile,
                  ),
                  const AppDivider(vertical: 0.0),
                  AppListRow(
                    title: tr('reg.change_pincode'),
                    leading: const AppIconTile(
                      size: 40.0,
                      child: Icon(Icons.lock_outline_rounded,
                          size: 20.0, color: Colors.white),
                    ),
                    onTap: _openChangePincode,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(
                  left: 4.0, top: 20.0, bottom: 8.0),
              child: Text(tr('reg.settings'), style: AppText.caption),
            ),
            AppCard(
              padding: const EdgeInsets.symmetric(
                  horizontal: 16.0, vertical: 6.0),
              child: AppListRow(
                title: tr('language.title'),
                leading: const AppIconTile(
                  size: 40.0,
                  child: Icon(Icons.language_rounded,
                      size: 20.0, color: Colors.white),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ValueListenableBuilder<AppLanguage>(
                      valueListenable: AppLocale.notifier,
                      builder: (context, lang, _) =>
                          Text(lang.label, style: AppText.caption),
                    ),
                    const SizedBox(width: 6.0),
                    Icon(Icons.chevron_right_rounded,
                        size: 20.0, color: CustomColors.textSecondary),
                  ],
                ),
                onTap: () => showLanguagePicker(context),
              ),
            ),
            const SizedBox(height: 12.0),
            AppCard(
              padding: const EdgeInsets.symmetric(
                  horizontal: 16.0, vertical: 6.0),
              child: InkWell(
                onTap: _confirmSignOut,
                borderRadius: BorderRadius.circular(12.0),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10.0),
                  child: Row(
                    children: [
                      AppIconTile(
                        size: 40.0,
                        color: CustomColors.negative.withOpacity(0.15),
                        child: Icon(Icons.logout_rounded,
                            size: 20.0, color: CustomColors.negative),
                      ),
                      const SizedBox(width: 12.0),
                      Expanded(
                        child: Text(
                          tr('reg.sign_out'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodyBold
                              .copyWith(color: CustomColors.negative),
                        ),
                      ),
                      const SizedBox(width: 10.0),
                      Icon(Icons.chevron_right_rounded,
                          size: 20.0,
                          color: CustomColors.negative.withOpacity(0.6)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24.0),
            FutureBuilder<PackageInfo>(
              future: PackageInfo.fromPlatform(),
              builder: (context, snapshot) {
                final info = snapshot.data;
                if (info == null) return const SizedBox.shrink();
                return Center(
                  child: Text(
                    "${info.appName}  v${info.version} (${info.buildNumber})",
                    style: AppText.caption
                        .copyWith(color: CustomColors.textTertiary),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        AppIconTile(
          size: 64.0,
          color: CustomColors.accentSoft,
          child: Icon(Icons.person_rounded,
              size: 34.0, color: CustomColors.accent),
        ),
        const SizedBox(width: 14.0),
        Expanded(
          child: isLoading
              ? const Align(
                  alignment: Alignment.centerLeft,
                  child: CupertinoActivityIndicator(color: Colors.white),
                )
              : currentUser != null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentUser!.firstName.isNotEmpty &&
                                  currentUser!.lastName.isNotEmpty
                              ? "${currentUser!.lastName.substring(0, 1)}.${currentUser!.firstName}"
                              : "-",
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title,
                        ),
                        const SizedBox(height: 4.0),
                        Text(
                          currentUser!.phone.isNotEmpty
                              ? currentUser!.phone
                              : currentUser!.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption,
                        ),
                      ],
                    )
                  : Text(
                      tr('reg.user_info_not_loaded'),
                      style: AppText.caption,
                    ),
        ),
        const SizedBox(width: 12.0),
        InkWell(
          onTap: _openEditProfile,
          borderRadius: BorderRadius.circular(12.0),
          child: const AppIconTile(
            size: 40.0,
            child: Icon(Icons.edit_outlined, size: 20.0, color: Colors.white),
          ),
        ),
      ],
    );
  }
}
