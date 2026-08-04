import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/bloc/make_order_bloc/make_order_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/Item_model.dart';

import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/order_agreement_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/payment_screen.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import 'metal_price_view.dart';

class MakeOrderView extends StatefulWidget {
  const MakeOrderView(
      {super.key,
      required this.userRepository,
      required this.uid,
      required this.metalId});
  final UserRepository userRepository;
  final String uid;
  final int metalId;

  @override
  State<MakeOrderView> createState() => _MakeOrderViewState();
}

class _MakeOrderViewState extends State<MakeOrderView> {
  late List<ItemModel> types = [];
  late ItemModel selectedType;

  @override
  void initState() {
    super.initState();
    
    if (widget.metalId == 1) {
      types.addAll([
        ItemModel("gold", tr('order.type_gold_sycee'),
            "assets/images/chinese.png", tr('order.type_gold_desc'), false, "ingot"),
        ItemModel("gold", tr('order.type_gold_coin'), "assets/images/coin.png",
            tr('order.type_gold_desc'), false, "coin"),
        ItemModel("gold", tr('order.type_gold_bar'), "assets/images/bars.png",
            tr('order.type_gold_bar_desc'), false, "bar"),
      ]);
    } else {
      print('Silver types');
    }
    selectedType = types[0];
    
    // Set initial text based on selected type
    if (selectedType.prodType == "bar") {
      text = "100";
    } else {
      text = "0";
    }
    
    print(types);
  }

  String text = "0";
  PageController pageController = PageController();
  bool monVal = false;

  @override
  Widget build(BuildContext context) {
    return BlocListener<MakeOrderBloc, MakeOrderState>(listener:
        (context, state) {
      if (state is MakeOrderFailed) {
        showAlertPopUpDialog(context, state.msg, 65);
      }
      if (state is MakeOrderSuccess) {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => PaymentScreen(
                    makeOrder: state.makeOrder,
                    userRepository: widget.userRepository,
                    uid: widget.uid, order: state.order,
                  )),
        );
      }
    }, child:
        BlocBuilder<MakeOrderBloc, MakeOrderState>(builder: (context, state) {
      return PageView(
        controller: pageController,
        children: [
          Column(
            children: [
              OrderAgreement(),
              Container(
                decoration: BoxDecoration(
                    border: Border(
                        top: BorderSide(width: 1.0, color: Colors.white12))),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.only(
                          top: 5.0, bottom: 5.0, right: 32.0, left: 16.0),
                      child: Row(
                        children: <Widget>[
                          Checkbox(
                            activeColor: CustomColors.mainColor,
                            value: monVal,
                            onChanged: (bool? value) {
                              setState(() {
                                monVal = value!;
                                print(monVal);
                              });
                            },
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  monVal = !monVal;
                                });
                              },
                              child: Text(
                                tr('order.accept_terms_checkbox'),
                                style: const TextStyle(
                                    fontSize: 12.0,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                    SafeArea(
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(
                                      bottom: 32.0,
                                      top: 8.0,
                                      right: 32.0,
                                      left: 32.0),
                                  child: MainButton(
                                      title: Text(
                                        tr('common.continue'),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black),
                                      ),
                                      onPress: () {
                                        if (!monVal) {
                                          showAlertPopUpDialog(
                                              context,
                                              tr('order.must_accept_terms'),
                                              85);
                                        } else {
                                          pageController.animateToPage(
                                              pageController.page!.toInt() + 1,
                                              duration: const Duration(
                                                  milliseconds: 100),
                                              curve: Curves.easeIn);
                                        }
                                      },
                                      isLoading: false),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            ],
          ),
          Column(
            children: [
              Expanded(
                child: ListView(
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    const SizedBox(
                      height: 16.0,
                    ),
                    Column(
                      children: [
                        Padding(
                          padding:
                              const EdgeInsets.only(left: 32.0, right: 32.0),
                          child: Text(
                            tr('order.select_type_prompt'),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 14.0,
                                fontWeight: FontWeight.bold,
                                color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: List.generate(
                            types.length,
                            (index) => GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      selectedType = types[index];
                                      // If selected type is "bar", set text to "100"
                                      if (selectedType.prodType == "bar") {
                                        text = "100";
                                      } else {
                                        text = "0";
                                      }
                                    });
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 16.0),
                                    child: Container(
                                      padding: const EdgeInsets.all(14.0),
                                      decoration: BoxDecoration(
                                          borderRadius:
                                              BorderRadius.circular(8.0),
                                          border: Border.all(
                                              width: 1.0,
                                              color: selectedType.prodType ==
                                                      types[index].prodType 
                                                  ? CustomColors.mainColor
                                                  : Colors.white24)),
                                      child: Column(
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  Image.asset(
                                                    types[index].asset,
                                                    width: 32.0,
                                                    height: 32.0,
                                                  ),
                                                  const SizedBox(
                                                    width: 8.0,
                                                  ),
                                                  Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Text(
                                                        types[index].title,
                                                        style: TextStyle(
                                                          fontSize: 14.0,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                          color: selectedType
                                                                      .prodType ==
                                                                  types[index]
                                                                      .prodType
                                                              ? CustomColors
                                                                      .mainColor
                                                              : Colors.white,
                                                        ),
                                                      ),
                                                      Text(
                                                          types[index]
                                                              .description,
                                                          style: TextStyle(
                                                              fontSize: 12.0,
                                                              color: selectedType
                                                                          .prodType ==
                                                                      types[index]
                                                                          .prodType
                                                                  ? CustomColors
                                                                      .mainColor
                                                                  : Colors
                                                                      .white54)),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                              Icon(
                                                selectedType.id ==
                                                        types[index].id
                                                    ? FluentIcons
                                                        .checkmark_circle_24_filled
                                                    : FluentIcons
                                                        .circle_24_regular,
                                                color: selectedType.prodType ==
                                                        types[index].prodType
                                                    ? CustomColors
                                                                      .mainColor
                                                    : Colors.white24,
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                )),
                      ),
                    ),
                  ],
                ),
              ),
              SafeArea(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: MainButton(
                                title: Text(
                                  tr('common.continue'),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black),
                                ),
                                onPress: () {
                                  pageController.animateToPage(
                                      pageController.page!.toInt() + 1,
                                      duration:
                                          const Duration(milliseconds: 100),
                                      curve: Curves.easeIn);
                                },
                                isLoading: false),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(
                            left: 32.0, right: 32.0, top: 16.0, bottom: 0.0),
                        child: Text(
                          selectedType.id == "gold"
                              ? tr('order.enter_gold_grams_prompt')
                              : tr('order.enter_silver_lan_prompt'),
                          textAlign: TextAlign.center,
                          style:
                              TextStyle(color: Colors.white54, fontSize: 14.0),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          selectedType.id == "gold"
                              ? tr('order.quantity_gram', {'qty': text})
                              : tr('order.quantity_lan', {'qty': text}),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontFamily: "InterBold",
                              fontSize: 25.0,
                              fontWeight: FontWeight.bold,
                              color: selectedType.id == "gold"
                                  ? CustomColors.mainColor
                                  : CustomColors.mainSilver),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(
                            left: 16.0, top: 0.0, right: 16.0),
                        child: Container(
                          width: MediaQuery.of(context).size.width,
                          height: 0.9,
                          color: Colors.white54,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(
                            left: 32.0, right: 32.0, top: 8.0, bottom: 8.0),
                        child: MetalPriceWidget(
                          userRepository: widget.userRepository,
                          quatity: double.tryParse(text) ?? 0,
                          metalId: selectedType.id == "gold" ? 1 : 3,
                          isAdditional: selectedType.isAdditional,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 16.0, right: 16.0),
                        child: Container(
                          width: MediaQuery.of(context).size.width,
                          height: 0.9,
                          color: Colors.white54,
                        ),
                      ),
                      selectedType.prodType == "bar"
                          ? Container()
                          : Column(
                              children: [
                                NumericKeyboard(
                                    onKeyboardTap: _onKeyboardTap,
                                    textStyle: TextStyle(
                                        fontSize: 25.0,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white),
                                    rightButtonFn: () {
                                      if (text.isEmpty) return;
                                      setState(() {
                                        if (text.length == 1 || text == "0.") {
                                          text = "0";
                                        } else {
                                          text = text.substring(
                                              0, text.length - 1);
                                        }
                                      });
                                    },
                                    rightButtonLongPressFn: () {
                                      if (text.isEmpty) return;
                                      setState(() {
                                        text = '0';
                                      });
                                    },
                                    rightIcon: const Icon(
                                      Ionicons.backspace_outline,
                                    ),
                                    leftButtonFn: () {
                                      // Add decimal point
                                      _onKeyboardTap('.');
                                    },
                                    leftIcon: Icon(Ionicons.ellipse,
                                        size: 8.0, color: Colors.white),
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween),
                              ],
                            ),
                    ],
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.only(
                        left: 32.0, right: 32.0, bottom: 32.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: MainButton(
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    tr('common.continue'),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black),
                                  ),
                                ],
                              ),
                              onPress: () async {
                                // Parse text to double instead of int
                                final double parsedValue = double.tryParse(text) ?? 0.0;
                                
                                if (parsedValue > 0) {
                                  if (parsedValue > 10000) {
                                    showAlertPopUpDialog(
                                        context,
                                        tr('order.max_per_order_exceeded'),
                                        85.0);
                                  } else {
                                    final num quantity = selectedType.id == "gold"
                                        ? parsedValue
                                        : (parsedValue * 37.5);
                                    final int metalId =
                                        selectedType.id == "gold" ? 1 : 3;
                                    final String prodType = selectedType.prodType; // must not be empty

                                    num price = 0;
                                    try {
                                      final q = await FirebaseFirestore
                                          .instance
                                          .collection('latest_rates')
                                          .where('id', isEqualTo: metalId)
                                          .limit(1)
                                          .get();
                                      if (q.docs.isNotEmpty) {
                                        final data = q.docs.first.data();
                                        final num? rateNum = data['rate'] as num?;
                                        price = rateNum ?? 0;
                                      }
                                    } catch (_) {
                                      price = 0;
                                    }

                                    if (price == 0) {
                                      showAlertPopUpDialog(
                                          context,
                                          tr('order.rate_not_found_retry'),
                                          85.0);
                                      return;
                                    }

                                    context.read<MakeOrderBloc>().add(
                                          MakeOrderPressed(
                                              widget.uid,
                                              quantity,
                                              metalId,
                                              prodType,
                                              price),
                                        );
                                  }
                                } else {
                                  showAlertPopUpDialog(context,
                                      tr('order.enter_quantity_prompt'), 65.0);
                                }
                              },
                              isLoading: state is MakeOrderLoading),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }));
  }

  _onKeyboardTap(String value) {
    setState(() {
      // Handle decimal point
      if (value == '.') {
        // Only allow one decimal point
        if (!text.contains('.')) {
          // If text is "0" or empty, make it "0."
          if (text == "0" || text.isEmpty) {
            text = "0.";
          } else {
            text = text + ".";
          }
        }
        return;
      }
      
      // Check if text already has decimal point
      if (text.contains('.')) {
        // If already has decimal, check decimal places
        final parts = text.split('.');
        if (parts[1].length >= 1) {
          // Already has 1 decimal place, don't add more
          return;
        }
      }
      
      // Limit total length (including decimal point)
      if (text.length >= 6) {
        return;
      }
      
      // Regular number input
      if (text == "0") {
        text = "";
        text = text + value;
      } else {
        text = text + value;
      }
    });
  }
}