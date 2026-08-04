import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:badges/badges.dart' as badges;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/balance_view.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/gold_rate_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/lottery_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/morin_khuur_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/notifications_screen.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/order_list_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/recent_news_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/safebox_main_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/update_registration_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/gift_screen/gift_screen.dart';
import 'package:onegrgold/screens/auth_screen/register_screen/help_screen.dart';
import 'package:onegrgold/style/colors.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.userRepository,
    required this.authRepository,
    required this.uid,
  });

  final UserRepository userRepository;
  final AuthRepository authRepository;
  final String uid;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _hasShownRegistrationDialog = false;

  void _showRegistrationNumberDialog(BuildContext context, UserModel user) {
    showDialog(
      context: context,
      barrierDismissible: false, // Cannot dismiss by tapping outside
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: CustomColors.darkContainerColor,
          title: Text(
            tr('home.registration_incomplete_title'),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          content: Text(
            tr('home.registration_incomplete_body'),
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _navigateToRegistrationUpdate(context, user);
              },
              child: Text(
                tr('home.update_registration'),
                style: TextStyle(
                    color: CustomColors.mainColor, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }

  void _navigateToRegistrationUpdate(BuildContext context, UserModel user) {
    Navigator.push(
      context,
      CupertinoPageRoute(
        builder: (_) => UpdateRegistrationScreen(
          userRepository: widget.userRepository,
          user: user,
        ),
      ),
    ).then((_) async {
      // Refresh user data after returning from update screen
      final updatedUser = await fetchUser();
      if (updatedUser != null) {
        final bool isComplete = updatedUser.firstName.isNotEmpty &&
            updatedUser.lastName.isNotEmpty &&
            updatedUser.registrationNumber.isNotEmpty;

        if (isComplete) {
          // All fields are filled, don't show dialog again
          _hasShownRegistrationDialog = true;
        } else {
          // Still missing data, allow dialog to show again
          _hasShownRegistrationDialog = false;
        }
      }
      setState(() {});
    });
  }

  Future<int> _getPendingGiftCount() async {
    try {
      // Debug auth status
      print('Current user ID: ${widget.uid}');
      print(
          'FirebaseAuth current user: ${FirebaseAuth.instance.currentUser?.uid}');

      final querySnapshot = await FirebaseFirestore.instance
          .collection('gift_orders')
          .where('receiver_id', isEqualTo: widget.uid)
          .where('status', isEqualTo: 'pending')
          .get();

      print('Found ${querySnapshot.docs.length} pending gifts');
      return querySnapshot.docs.length;
    } catch (e) {
      print('Error fetching pending gifts: $e');
      print('User ID: ${widget.uid}');
      print(
          'FirebaseAuth current user: ${FirebaseAuth.instance.currentUser?.uid}');
      return 0;
    }
  }

  /// Red count badge used by every app-bar icon, so notification and gift
  /// badges stay pixel-identical.
  Widget _countBadge({required int count, required String asset}) {
    return badges.Badge(
      showBadge: count > 0,
      position: badges.BadgePosition.topEnd(top: -4, end: -4),
      badgeContent: Text(
        count > 99 ? '99+' : '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 8,
          height: 1,
          fontFamily: "RubikBold",
        ),
      ),
      badgeStyle: const badges.BadgeStyle(
        badgeColor: Colors.red,
        elevation: 0,
        padding: EdgeInsets.all(3),
      ),
      child: SvgPicture.asset(asset, color: Colors.white),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RepositoryProvider.value(
      value: widget.userRepository,
      child: FutureBuilder<UserModel?>(
        future: fetchUser(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CupertinoActivityIndicator());
          }
          if (!snapshot.hasData || snapshot.data == null) {
            return Center(child: Text(tr('home.no_data')));
          }

          final user = snapshot.data!;

          // Check if firstName, lastName, or registration_number is empty or null
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final bool needsUpdate = user.firstName.isEmpty ||
                user.lastName.isEmpty ||
                user.registrationNumber.isEmpty;

            if (needsUpdate && !_hasShownRegistrationDialog) {
              _hasShownRegistrationDialog = true;
              _showRegistrationNumberDialog(context, user);
            }
          });

          return Scaffold(
            appBar: PreferredSize(
              preferredSize: const Size.fromHeight(45.0),
              child: AppBar(
                centerTitle: false,
                elevation: 0.0,
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${greeting()} 👋",
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.white70),
                    ),
                    const SizedBox(
                      height: 4.0,
                    ),
                    Text(
                      user.firstName.isNotEmpty && user.lastName.isNotEmpty
                          ? "${user.lastName.substring(0, 1)}.${user.firstName}"
                          : "-",
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14.0,
                          color: Colors.white),
                    )
                  ],
                ),
                actions: [
                  // Unread-notification count, live from Firestore. Docs
                  // without a `read` field count as unread.
                  StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                    stream: FirebaseFirestore.instance
                        .collection('users')
                        .doc(widget.uid)
                        .collection('notifications')
                        .snapshots(),
                    builder: (context, snap) {
                      final unread = snap.hasData
                          ? snap.data!.docs
                              .where((d) => d.data()['read'] != true)
                              .length
                          : 0;
                      return IconButton(
                        icon: _countBadge(
                          count: unread,
                          asset: "assets/icons/notification.svg",
                        ),
                        onPressed: () {
                          Navigator.push(
                              context,
                              CupertinoPageRoute(
                                  builder: (_) => NotificationScreen()));
                        },
                      );
                    },
                  ),
                  FutureBuilder<int>(
                    future: _getPendingGiftCount(),
                    builder: (context, badgeSnapshot) {
                      final pendingCount = badgeSnapshot.data ?? 0;

                      return IconButton(
                        icon: _countBadge(
                          count: pendingCount,
                          asset: "assets/icons/gift-line.svg",
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            CupertinoPageRoute(
                              builder: (_) => GiftListScreen(
                                userRepository: widget.userRepository,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                  Builder(
                    builder: (context) => IconButton(
                      icon: SvgPicture.asset(
                        "assets/icons/burger.svg",
                        color: Colors.white,
                      ),
                      onPressed: () {
                        Navigator.push(
                            context,
                            CupertinoPageRoute(
                                builder: (_) => const HelpScreen()));
                      },
                    ),
                  ),
                ],
              ),
            ),
            body: RefreshIndicator(
              backgroundColor: CustomColors.darkContainerColor,
              color: Colors.white,
              onRefresh: () {
                return fetchUser();
              },
              child: ListView(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(
                            left: 16.0, right: 16.0, top: 16.0, bottom: 16.0),
                        child: Container(
                          decoration: const BoxDecoration(
                            boxShadow: [
                              BoxShadow(
                                  color: Colors.black26,
                                  offset: Offset(0, 3),
                                  blurRadius: 6.0)
                            ],
                          ),
                          child: Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(18.0),
                                  border: Border.all(
                                      width: 0.5,
                                      color: CustomColors.darkContainerColor),
                                  image: const DecorationImage(
                                      fit: BoxFit.cover,
                                      image: AssetImage(
                                          "assets/images/backgrounds/background-1.jpg")),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(
                                              left: 16.0,
                                              right: 16.0,
                                              top: 16.0,
                                              bottom: 16.0),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                tr('home.my_valuables'),
                                                style: const TextStyle(
                                                    fontFamily: "InterBold",
                                                    shadows: <Shadow>[
                                                      Shadow(
                                                        offset:
                                                            Offset(1.0, 1.0),
                                                        blurRadius: 3.0,
                                                        color: Color.fromARGB(
                                                            255, 0, 0, 0),
                                                      ),
                                                      Shadow(
                                                        offset:
                                                            Offset(2.0, 2.0),
                                                        blurRadius: 8.0,
                                                        color: Color.fromARGB(
                                                            255, 0, 0, 0),
                                                      ),
                                                    ],
                                                    fontSize: 14.0,
                                                    color: Colors.white),
                                              ),
                                            ],
                                          ),
                                        ),
                                        BalanceView(
                                          uid: widget.uid,
                                        )
                                      ],
                                    ),
                                  ],
                                ),
                              ), /* 
                          SizedBox(
                            height: 180.0,
                            width: MediaQuery.of(context).size.width - 40.0,
                            child: Newton(
                              activeEffects: [
                                RainEffect(
                                  particleConfiguration: ParticleConfiguration(
                                    shape: CircleShape(),
                                    size: const Size(1, 1),
                                    color: SingleParticleColor(
                                        color: CustomColors.mainColor),
                                  ),
                                  effectConfiguration:
                                      const EffectConfiguration(
                                          minDuration: 2000,
                                          maxDuration: 4000,
                                          particleCount: 1000),
                                ),
                                RainEffect(
                                  particleConfiguration: ParticleConfiguration(
                                    shape: CircleShape(),
                                    size: const Size(1.5, 1.5),
                                    color: SingleParticleColor(
                                        color: CustomColors.mainSilver),
                                  ),
                                  effectConfiguration:
                                      const EffectConfiguration(
                                          minDuration: 1000,
                                          maxDuration: 1500,
                                          particleCount: 1000),
                                ),
                                RainEffect(
                                  particleConfiguration: ParticleConfiguration(
                                    shape: CircleShape(),
                                    size: const Size(1.8, 1.8),
                                    color: SingleParticleColor(
                                        color: CustomColors.mainSilver),
                                  ),
                                  effectConfiguration:
                                      const EffectConfiguration(
                                          minDuration: 500,
                                          maxDuration: 1000,
                                          particleCount: 1000),
                                ),
                                RainEffect(
                                  particleConfiguration: ParticleConfiguration(
                                    shape: CircleShape(),
                                    size: const Size(1.8, 1.8),
                                    color: SingleParticleColor(
                                        color: CustomColors.mainColor),
                                  ),
                                  effectConfiguration:
                                      const EffectConfiguration(
                                          minDuration: 500,
                                          maxDuration: 1000,
                                          particleCount: 1000),
                                )
                              ],
                            ),
                          ), */
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  // Title for Safebox and News

                  // Services row. The right slot shows the Морин хуур donation
                  // campaign while active, otherwise the loan service.
                  Row(
                    children: [
                      const MorinKhuurWidget(),
                      LotteryWidget(
                        uid: widget.uid,
                        userRepository: widget.userRepository,
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(
                        left: 16.0, top: 16.0, bottom: 16.0),
                    child: Text(
                      tr('home.todays_rate'),
                      style: const TextStyle(
                        fontFamily: "InterBold",
                        fontSize: 14.0,
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(
                      left: 16.0,
                      right: 16.0,
                    ),
                    child: Row(
                      children: [
                        Expanded(child: GoldRateWidget()),
                      ],
                    ),
                  ),
                  const SizedBox(
                    height: 8.0,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          tr('home.orders'),
                          style: const TextStyle(
                            fontFamily: "InterBold",
                            fontSize: 14.0,
                          ),
                        ),
                        TextButton(
                            onPressed: () {},
                            child: Text(
                              tr('home.see_all'),
                              style: TextStyle(
                                  fontSize: 12.0,
                                  fontFamily: "Inter",
                                  fontWeight: FontWeight.bold,
                                  color: CustomColors.mainColor),
                            ))
                      ],
                    ),
                  ),
                  const Padding(
                      padding:
                          EdgeInsets.only(right: 16.0, left: 16.0, top: 16.0),
                      child: OrderList())
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  String greeting() {
    var hour = DateTime.now().hour;
    if (hour < 12 && hour > 5) {
      return tr('home.greeting_morning');
    }
    if (hour < 17 && hour > 12) {
      return tr('home.greeting_afternoon');
    }
    if (hour < 5) {
      return tr('home.greeting_evening');
    }
    return tr('home.greeting_evening');
  }

  Future<UserModel?> fetchUser() async {
    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(widget.uid)
        .get();
    if (doc.exists) {
      return UserModel.fromMap(widget.uid, doc.data()!);
    }
    return null;
  }
}
