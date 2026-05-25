import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/make_order_screen.dart';
import 'package:onegrgold/bloc/send_gift/send_gift_bloc.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/send_gift_screen/send_gift_screen.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_bloc.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_withdraw_screen/make_withdraw_screen.dart';

class BalanceView extends StatefulWidget {
  const BalanceView({super.key, required this.uid});
  final String uid;

  @override
  State<BalanceView> createState() => _BalanceViewState();
}

class _BalanceViewState extends State<BalanceView> {
  final currencyFormatter = NumberFormat();
  final Shader linearGradient = CustomColors.mainGradient
      .createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 70.0));
  final Shader linearSilverGradient = CustomColors.mainSilverGradient
      .createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 70.0));
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(widget.uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError || !snapshot.hasData || !snapshot.data!.exists) {
          return const Center(
            child: Text(
              'Мэдээлэл ачаалахад алдаа гарлаа',
              style: TextStyle(color: Colors.white),
            ),
          );
        }

        final userData = snapshot.data!.data() as Map<String, dynamic>;
        final userModel = UserModel.fromMap(widget.uid, userData);

        return _buildBalanceView(context, userModel);
      },
    );
  }

  Widget _buildBalanceView(BuildContext context, UserModel userModel) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Text(
                        "Алт:",
                        style: TextStyle(shadows: <Shadow>[
                          Shadow(
                            offset: Offset(1.0, 1.0),
                            blurRadius: 3.0,
                            color: Color.fromARGB(255, 0, 0, 0),
                          ),
                          Shadow(
                            offset: Offset(2.0, 2.0),
                            blurRadius: 8.0,
                            color: Color.fromARGB(255, 0, 0, 0),
                          ),
                        ], fontSize: 12.0, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 2.0,
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        "${userModel.balance.gold}гр",
                        style: TextStyle(
                            fontFamily: "InterBold",
                            fontSize: 18.0,
                            shadows: <Shadow>[
                              Shadow(
                                offset: Offset(1.0, 1.0),
                                blurRadius: 3.0,
                                color: Color.fromARGB(255, 0, 0, 0),
                              ),
                              const Shadow(
                                offset: Offset(2.0, 2.0),
                                blurRadius: 8.0,
                                color: Color.fromARGB(255, 0, 0, 0),
                              ),
                            ],
                            fontWeight: FontWeight.bold,
                            foreground: Paint()..shader = linearGradient),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 8.0,
                  ),
                  const Text(
                    "Мөнгө:",
                    style: TextStyle(
                        fontSize: 12.0,
                        shadows: <Shadow>[
                          Shadow(
                            offset: Offset(1.0, 1.0),
                            blurRadius: 3.0,
                            color: Color.fromARGB(255, 0, 0, 0),
                          ),
                          Shadow(
                            offset: Offset(2.0, 2.0),
                            blurRadius: 8.0,
                            color: Color.fromARGB(255, 0, 0, 0),
                          ),
                        ],
                        color: Colors.white),
                  ),
                  const SizedBox(
                    height: 2.0,
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        "${(userModel.balance.silver / 37.5).toStringAsFixed(2)}лан",
                        style: TextStyle(
                            fontFamily: "InterBold",
                            fontSize: 18.0,
                            shadows: <Shadow>[
                              const Shadow(
                                offset: Offset(1.0, 1.0),
                                blurRadius: 3.0,
                                color: Color.fromARGB(255, 0, 0, 0),
                              ),
                              const Shadow(
                                offset: Offset(2.0, 2.0),
                                blurRadius: 8.0,
                                color: Color.fromARGB(255, 0, 0, 0),
                              ),
                            ],
                            fontWeight: FontWeight.bold,
                            foreground: Paint()..shader = linearSilverGradient),
                      ),
                    ],
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(right: 32.0),
                child: SizedBox(
                    width: 120.0,
                    child: Image.asset("assets/images/golden-logo.png")),
              ),
            ],
          ),
        ),
        const Padding(
          padding: EdgeInsets.only(
              left: 0.0, top: 16.0, right: 0.0, bottom: 0.0),
        ),
        Container(
          decoration: BoxDecoration(
              border: Border(
                  top: BorderSide(
                      width: 1.0, color: CustomColors.mainColor)),
              borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16.0),
                  bottomRight: Radius.circular(16.0)),
              color: CustomColors.darkContainerColor),
          child: Row(
            children: [
              Expanded(
                  child: TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MakeOrderScreen(
                              userRepository: context.read<UserRepository>(),
                              uid: userModel.uid,
                              metalId: 1, // Gold by default
                            ),
                          ),
                        );
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(bottom: 2.0),
                            child: SvgPicture.asset(
                              "assets/icons/gold-bar-active.svg",
                              color:  CustomColors.mainColor,
                            ),
                          ),
                          const SizedBox(
                            width: 8.0,
                          ),
                          Text(
                            "Захиалах",
                            style: TextStyle(
                                shadows: <Shadow>[
                                  Shadow(
                                    offset: const Offset(1.0, 1.0),
                                    blurRadius: 2.0,
                                    color: CustomColors.mainColor
                                        .withOpacity(0.3),
                                  ),
                                ],
                                color: CustomColors.mainColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 12.0),
                          )
                        ],
                      ))),
              Container(
                height: 20.0,
                width: 1.0,
                color: Colors.white,
              ),
              Expanded(
                  child: TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => SendGiftBloc(
                                userRepository: context.read<UserRepository>(),
                              ),
                              child: SendGiftScreen(userModel: userModel),
                            ),
                          ),
                        );
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(bottom: 2.0),
                            child: SvgPicture.asset(
                              "assets/icons/gift.svg",
                              color:  CustomColors.mainSilver,
                            ),
                          ),
                          const SizedBox(
                            width: 8.0,
                          ),
                           Text(
                            "Бэлэглэх",
                            style: TextStyle(
                                color:  CustomColors.mainSilver,
                                fontWeight: FontWeight.bold,
                                fontSize: 12.0),
                          )
                        ],
                      ))),
                      Container(
                height: 20.0,
                width: 1.0,
                color: Colors.white,
              ),
              // Withdraw Request Button
              
              Expanded(
                  child: TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => MakeWithdrawRequestBloc(),
                              child: MakeWithdrawScreen(userModel: userModel),
                            ),
                          ),
                        );
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(bottom: 2.0),
                            child: SvgPicture.asset(
                              
                              "assets/icons/hand-gold.svg",
                              height: 23.0,
                              color:  CustomColors.mainSilver,
                            ),
                          ),
                          const SizedBox(
                            height: 2.0,
                          ),
                           Text(
                            "Биетээр авах",
                            style: TextStyle(
                                color:  CustomColors.mainSilver,
                                fontWeight: FontWeight.bold,
                                fontSize: 12.0),
                          )
                        ],
                      ))),
            ],
          ),
        )
      ],
    );
  }
}