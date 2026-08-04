import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/l10n/language_switcher.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:ionicons/ionicons.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../bloc/auth_bloc/auth_bloc.dart';
import '../../../elements/custom_pop_up.dart';
import '../../../repositories/user_repository.dart';
import '../../../style/colors.dart';
import '../../../models/user_model.dart';
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
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(0.0),
          child: AppBar(
            centerTitle: false,
            elevation: 0.0,
            title: const Text(''),
            systemOverlayStyle: SystemUiOverlayStyle.light,
          ),
        ),
        body: Column(
          children: <Widget>[
            Container(
              height: 120.0,
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 60.0,
                        width: 60.0,
                        child: SvgPicture.asset(
                          "assets/icons/user-active.svg",
                          color: Colors.white.withOpacity(0.3),
                        ),
                      ),
                      const SizedBox(
                        width: 8.0,
                      ),
                      if (isLoading)
                        const CircularProgressIndicator(strokeWidth: 2.0)
                      else if (currentUser != null)
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              currentUser!.firstName.isNotEmpty && currentUser!.lastName.isNotEmpty
                                  ? "${currentUser!.lastName.substring(0, 1)}.${currentUser!.firstName}"
                                  : "-",
                              style: const TextStyle(
                                  fontSize: 16.0, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(
                              height: 4.0,
                            ),
                            Text(
                              currentUser!.phone.isNotEmpty 
                                  ? currentUser!.phone 
                                  : currentUser!.email,
                              style: TextStyle(
                                  fontSize: 12.0,
                                  color: Colors.white.withOpacity(0.6)),
                            ),
                          ],
                        )
                      else
                        Text(
                          tr('reg.user_info_not_loaded'),
                          style: const TextStyle(
                              fontSize: 12.0, color: Colors.grey),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 16.0, bottom: 8.0),
                    child: Text(
                      tr('reg.settings'),
                      style: const TextStyle(fontFamily: "InterBold"),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8.0),
                          color: CustomColors.darkContainerColor),
                      child: Column(
                        children: [
                          GestureDetector(
                            onTap: () async {
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
                            },
                            child: Container(
                              height: 60.0,
                              color: CustomColors.darkContainerColor,
                              padding: const EdgeInsets.all(8.0),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(FluentIcons
                                          .text_bullet_list_square_edit_24_regular),
                                      const SizedBox(
                                        width: 8.0,
                                      ),
                                      Text(
                                        tr('reg.edit_profile'),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12.0),
                                      ),
                                    ],
                                  ),
                                  Icon(
                                    Ionicons.chevron_forward,
                                    color:
                                        CustomColors.textGrey.withOpacity(0.6),
                                    size: 18.0,
                                  )
                                ],
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ChangePincodeScreen(
                                    userRepository: widget.userRepository,
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              height: 60.0,
                              color: CustomColors.darkContainerColor,
                              padding: const EdgeInsets.all(8.0),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                          FluentIcons.lock_closed_24_regular),
                                      const SizedBox(
                                        width: 8.0,
                                      ),
                                      Text(
                                        tr('reg.change_pincode'),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12.0),
                                      ),
                                    ],
                                  ),
                                  Icon(
                                    Ionicons.chevron_forward,
                                    color:
                                        CustomColors.textGrey.withOpacity(0.6),
                                    size: 18.0,
                                  )
                                ],
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => showLanguagePicker(context),
                            child: Container(
                              height: 60.0,
                              color: CustomColors.darkContainerColor,
                              padding: const EdgeInsets.all(8.0),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                          FluentIcons.local_language_24_regular),
                                      const SizedBox(
                                        width: 8.0,
                                      ),
                                      Text(
                                        tr('language.title'),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12.0),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      ValueListenableBuilder<AppLanguage>(
                                        valueListenable: AppLocale.notifier,
                                        builder: (context, lang, _) => Text(
                                          lang.label,
                                          style: TextStyle(
                                            fontSize: 12.0,
                                            color: CustomColors.textGrey,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6.0),
                                      Icon(
                                        Ionicons.chevron_forward,
                                        color: CustomColors.textGrey
                                            .withOpacity(0.6),
                                        size: 18.0,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: GestureDetector(
                      onTap: () {
                        showPopUpDialog(context, tr('reg.sign_out_title'),
                            tr('reg.sign_out_confirm'), [
                          CupertinoDialogAction(
                              child: Text(
                                tr('reg.yes'),
                                style: TextStyle(color: CustomColors.alerRed),
                              ),
                              onPressed: () {
                                Navigator.pop(context);
                                // Dispatch logout; listener above will navigate
                                context.read<AuthBloc>().add(LoggedOut());
                              }),
                          CupertinoDialogAction(
                            child: Text(
                              tr('reg.no'),
                              style: const TextStyle(color: Colors.white),
                            ),
                            onPressed: () {
                              Navigator.pop(context);
                            },
                          )
                        ]);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8.0),
                        decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8.0),
                            color: CustomColors.darkContainerColor),
                        child: Column(
                          children: [
                            Container(
                              height: 45.0,
                              color: CustomColors.darkContainerColor,
                              padding: const EdgeInsets.all(8.0),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Transform.scale(
                                        scale: 0.90,
                                        child: SvgPicture.asset(
                                          "assets/icons/log-out.svg",
                                          color: CustomColors.alerRed,
                                        ),
                                      ),
                                      const SizedBox(
                                        width: 8.0,
                                      ),
                                      Text(
                                        tr('reg.sign_out'),
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: CustomColors.alerRed,
                                            fontSize: 12.0),
                                      ),
                                    ],
                                  ),
                                  Icon(
                                    Ionicons.chevron_forward,
                                    color:
                                        CustomColors.alerRed.withOpacity(0.6),
                                    size: 18.0,
                                  )
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}