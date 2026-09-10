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
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/balance_view.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/home_action_bar.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/campaign_banner_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/lottery_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/rate_card_widget.dart';
import 'package:onegrgold/screens/app_new_screen/shuteen_screen/shuteen_home_card.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/notifications_screen.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/order_list_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/recent_news_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/safebox_main_widget.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/update_registration_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/gift_screen/gift_screen.dart';
import 'package:onegrgold/screens/app_new_screen/profile_screen/profile_screen.dart';
import 'package:onegrgold/style/app_text.dart';
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
  // build бүрт дахин татахгүй; refresh хийхэд л шинэчилнэ
  late Future<UserModel?> _userFuture = fetchUser();

  void _showRegistrationNumberDialog(BuildContext context, UserModel user) {
    showDialog(
      context: context,
      barrierDismissible: false, // Cannot dismiss by tapping outside
      builder: (BuildContext context) {
        return AppDialog(
          icon: Icons.badge_outlined,
          title: tr('home.registration_incomplete_title'),
          message: tr('home.registration_incomplete_body'),
          primaryLabel: tr('home.update_registration'),
          onPrimary: () {
            Navigator.of(context).pop();
            _navigateToRegistrationUpdate(context, user);
          },
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
        future: _userFuture,
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
            backgroundColor: CustomColors.appBackground,
            appBar: PreferredSize(
              preferredSize: const Size.fromHeight(64.0),
              child: AppBar(
                centerTitle: false,
                elevation: 0.0,
                backgroundColor: CustomColors.appBackground,
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${greeting()} 👋",
                      style: AppText.caption,
                    ),
                    const SizedBox(
                      height: 4.0,
                    ),
                    Text(
                      user.firstName.isNotEmpty && user.lastName.isNotEmpty
                          ? "${user.lastName.substring(0, 1)}.${user.firstName}"
                          : "-",
                      style: AppText.title,
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
                        "assets/icons/user.svg",
                        color: Colors.white,
                      ),
                      onPressed: () {
                        Navigator.push(
                            context,
                            CupertinoPageRoute(
                                builder: (_) => ProfileScreen(
                                    userRepository:
                                        widget.userRepository)));
                      },
                    ),
                  ),
                ],
              ),
            ),
            body: RefreshIndicator(
              backgroundColor: CustomColors.surface,
              color: CustomColors.accent,
              onRefresh: () async {
                final f = fetchUser();
                setState(() => _userFuture = f);
                await f;
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
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20.0),
                            boxShadow: [
                              // Картын доорх гүн сүүдэр — биетэй харагдуулна
                              BoxShadow(
                                  color: Colors.black.withOpacity(0.55),
                                  offset: const Offset(0, 14),
                                  blurRadius: 28.0,
                                  spreadRadius: -6.0),
                              BoxShadow(
                                  color: CustomColors.accent.withOpacity(0.10),
                                  offset: const Offset(0, 4),
                                  blurRadius: 18.0),
                            ],
                          ),
                          child: Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(20.0),
                                  border: Border.all(
                                      width: 1.0,
                                      color: const Color(0x66120C02)),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(20.0),
                                  child: Stack(
                                    children: [
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              BalanceView(
                                                uid: widget.uid,
                                              )
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
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
                                        color: CustomColors.accent),
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
                                        color: CustomColors.accent),
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

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: HomeActionBar(userModel: user),
                  ),
                  const SizedBox(height: 8.0),
                  // Үйлчилгээний мөр: өнөөдрийн ханш (үргэлж) + хуваан төлөлт
                  Row(
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(left: 16.0),
                        child: RateCardWidget(),
                      ),
                      LotteryWidget(
                        uid: widget.uid,
                        userRepository: widget.userRepository,
                      ),
                    ],
                  ),
                  // Шүтээн хуур — хэсэгчилсэн эзэмшлийн том карт, идэвхтэй үед
                  const ShuteenHomeCard(),
                  // Сугалаат аян — hidden entirely when no campaign runs.
                  const CampaignBannerWidget(),
                  AppSectionHeader(
                    title: tr('home.orders'),
                    actionLabel: tr('home.see_all'),
                    onAction: () {},
                  ),
                  const Padding(
                      padding: EdgeInsets.only(right: 16.0, left: 16.0),
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
