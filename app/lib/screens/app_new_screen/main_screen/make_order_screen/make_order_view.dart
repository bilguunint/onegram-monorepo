import 'package:fluentui_system_icons/fluentui_system_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ionicons/ionicons.dart';
import 'package:onegrgold/bloc/make_order_bloc/make_order_bloc.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/Item_model.dart';

import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/order_agreement_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/payment_screen.dart';
import 'package:onegrgold/style/app_text.dart';
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

  /// Дэлгэцийн доод CTA — бүх хуудсанд ижил зай
  Widget _bottomCta(Widget button) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 12.0),
        child: button,
      ),
    );
  }

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
          // ---------------------------------------------- 1. Нөхцөл зөвшөөрөх
          Column(
            children: [
              const OrderAgreement(),
              Container(
                decoration: BoxDecoration(
                    border: Border(
                        top: BorderSide(
                            width: 1.0, color: CustomColors.surfaceBorder))),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(8.0, 6.0, 16.0, 0.0),
                      child: Row(
                        children: <Widget>[
                          Checkbox(
                            activeColor: CustomColors.accent,
                            checkColor: Colors.black,
                            side: const BorderSide(
                                width: 1.5, color: Colors.white38),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(5.0)),
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
                                style: AppText.caption.copyWith(
                                    color: Colors.white.withOpacity(0.85)),
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                    _bottomCta(
                      AppPrimaryButton(
                        label: tr('common.continue'),
                        onPressed: () {
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
                      ),
                    ),
                  ],
                ),
              )
            ],
          ),
          // ---------------------------------------------- 2. Төрөл сонгох
          Column(
            children: [
              Expanded(
                child: ListView(
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 32.0),
                  children: [
                    const SizedBox(height: 8.0),
                    Text(
                      tr('order.select_type_prompt'),
                      textAlign: TextAlign.center,
                      style: AppText.sectionTitle,
                    ),
                    const SizedBox(height: 16.0),
                    ...List.generate(
                        types.length,
                        (index) => Padding(
                              padding: const EdgeInsets.only(bottom: 12.0),
                              child: _TypeCard(
                                item: types[index],
                                selected: selectedType.prodType ==
                                    types[index].prodType,
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
                              ),
                            )),
                  ],
                ),
              ),
              _bottomCta(
                AppPrimaryButton(
                  label: tr('common.continue'),
                  onPressed: () {
                    pageController.animateToPage(
                        pageController.page!.toInt() + 1,
                        duration:
                            const Duration(milliseconds: 100),
                        curve: Curves.easeIn);
                  },
                ),
              ),
            ],
          ),
          // ---------------------------------------------- 3. Хэмжээ оруулах
          Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 16.0),
                  children: [
                    // Том дүн — карт дотор шошго + display хэмжээ
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            selectedType.id == "gold"
                                ? tr('order.enter_gold_grams_prompt')
                                : tr('order.enter_silver_lan_prompt'),
                            style: AppText.caption,
                          ),
                          const SizedBox(height: 8.0),
                          Text(
                            selectedType.id == "gold"
                                ? tr('order.quantity_gram', {'qty': text})
                                : tr('order.quantity_lan', {'qty': text}),
                            style: AppText.display.copyWith(fontSize: 32.0),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12.0),
                    MetalPriceWidget(
                      userRepository: widget.userRepository,
                      quatity: double.tryParse(text) ?? 0,
                      metalId: selectedType.id == "gold" ? 1 : 3,
                      isAdditional: selectedType.isAdditional,
                    ),
                    selectedType.prodType == "bar"
                        ? Container()
                        : Column(
                            children: [
                              const SizedBox(height: 12.0),
                              NumericKeyboard(
                                  onKeyboardTap: _onKeyboardTap,
                                  textStyle: AppText.title.copyWith(
                                      fontSize: 24.0, height: 1.0),
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
                                    color: Colors.white,
                                  ),
                                  leftButtonFn: () {
                                    // Add decimal point
                                    _onKeyboardTap('.');
                                  },
                                  leftIcon: const Icon(Ionicons.ellipse,
                                      size: 8.0, color: Colors.white),
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween),
                            ],
                          ),
                  ],
                ),
              ),
              _bottomCta(
                AppPrimaryButton(
                  label: tr('common.continue'),
                  loading: state is MakeOrderLoading,
                  onPressed: () async {
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
                ),
              ),
            ],
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

/// Захиалгын төрлийн сонголтын карт — сонгогдсон үед алтан хүрээ + зөөлөн
/// алтан дэвсгэр, зүүн талд зургийн tile, баруун талд check icon.
class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final ItemModel item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20.0),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(14.0),
          decoration: BoxDecoration(
            color: selected ? CustomColors.accentSoft : CustomColors.surface,
            borderRadius: BorderRadius.circular(20.0),
            border: Border.all(
              width: 1.0,
              color:
                  selected ? CustomColors.accent : CustomColors.surfaceBorder,
            ),
          ),
          child: Row(
            children: [
              AppIconTile(
                size: 46.0,
                child: Image.asset(
                  item.asset,
                  width: 28.0,
                  height: 28.0,
                ),
              ),
              const SizedBox(width: 12.0),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: AppText.bodyBold.copyWith(
                        color: selected ? CustomColors.accent : Colors.white,
                      ),
                    ),
                    const SizedBox(height: 3.0),
                    Text(item.description, style: AppText.caption),
                  ],
                ),
              ),
              const SizedBox(width: 10.0),
              Icon(
                selected
                    ? FluentIcons.checkmark_circle_24_filled
                    : FluentIcons.circle_24_regular,
                color:
                    selected ? CustomColors.accent : CustomColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
