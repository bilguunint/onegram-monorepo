import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:ionicons/ionicons.dart';
import 'package:pin_code_text_field/pin_code_text_field.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_bloc.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_event.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_state.dart';
import 'package:onegrgold/elements/alert_pop_up.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_withdraw_screen/success_withdraw_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_withdraw_screen/make_withdraw_agreement.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onscreen_num_keyboard/onscreen_num_keyboard.dart';

class MakeWithdrawScreen extends StatefulWidget {
  const MakeWithdrawScreen({super.key, required this.userModel});
  
  final UserModel userModel;

  @override
  State<MakeWithdrawScreen> createState() => _MakeWithdrawScreenState();
}

class _MakeWithdrawScreenState extends State<MakeWithdrawScreen> {
  final PageController pageController = PageController();
  final _pinController = TextEditingController();
  String quantityText = "0";
  int _metalId = 1; // Default to gold
  bool agreementAccepted = false; // Agreement checkbox state

  @override
  void dispose() {
    _pinController.dispose();
    pageController.dispose();
    super.dispose();
  }

  void _onKeyboardTap(String value) {
    setState(() {
      if (quantityText == "0") {
        quantityText = "";
        quantityText = quantityText + value;
      } else {
        quantityText = quantityText + value;
      }
    });
  }

  void _onPinKeyboardTap(String value) {
    setState(() {
      if (_pinController.text.length < 6) {
        _pinController.text = _pinController.text + value;
      }
    });
  }

  void _onPinBackspace() {
    setState(() {
      if (_pinController.text.isNotEmpty) {
        _pinController.text = _pinController.text.substring(0, _pinController.text.length - 1);
      }
    });
  }

  void _onPinClear() {
    setState(() {
      _pinController.clear();
    });
  }

  void _submit(BuildContext context) {
    HapticFeedback.lightImpact();
    final qty = num.tryParse(quantityText) ?? 0;

    print('Submitting withdraw request: qty=$qty, metalId=$_metalId, pin=${_pinController.text}'); // Debug

    context.read<MakeWithdrawRequestBloc>().add(MakeWithdrawRequestSubmitted(
          quantity: qty.toDouble(),
          metalId: _metalId,
          pincode: _pinController.text,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Биетээр авах хүсэлт'),
        backgroundColor: CustomColors.scaffoldDarkBack,
      ),
      backgroundColor: CustomColors.scaffoldDarkBack,
      body: BlocConsumer<MakeWithdrawRequestBloc, MakeWithdrawRequestState>(
        listener: (context, state) {
          print('MakeWithdrawRequestBloc state changed to: ${state.runtimeType}'); // Debug
          if (state is MakeWithdrawRequestFailure) {
            print('MakeWithdrawRequest failed: ${state.message}'); // Debug
            showAlertPopUpDialog(context, state.message, 70);
          }
          if (state is MakeWithdrawRequestSuccess) {
            print('MakeWithdrawRequest success: ${state.response.withdrawId}'); // Debug
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => SuccessWithdrawScreen(
                  withdrawResponse: state.response,
                ),
              ),
            );
          }
          if (state is MakeWithdrawRequestLoading) {
            print('MakeWithdrawRequest loading...'); // Debug
          }
        },
        builder: (context, state) {
          final loading = state is MakeWithdrawRequestLoading;
          return PageView(
            controller: pageController,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              // Page 0: Agreement Page
              Column(
                children: [
                  const MakeWithdrawAgreement(),
                  Container(
                    decoration: const BoxDecoration(
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
                                value: agreementAccepted,
                                onChanged: (bool? value) {
                                  setState(() {
                                    agreementAccepted = value!;
                                  });
                                },
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      agreementAccepted = !agreementAccepted;
                                    });
                                  },
                                  child: const Text(
                                    "Үйлчилгээний нөхцөлийг хүлээн зөвшөөрч байна.",
                                    style: TextStyle(
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
                                          title: const Text(
                                            "Үргэлжлүүлэх",
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.black),
                                          ),
                                          onPress: () {
                                            if (!agreementAccepted) {
                                              showAlertPopUpDialog(
                                                  context,
                                                  "Үйлчилгээний нөхцөлтэй танилцаж зөвшөөрнө үү.",
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
              // Page 1: Quantity Selection
              SafeArea(
                child: ListView(
                  children: [
                    const SizedBox(height: 20),
                    SvgPicture.asset(
                      "assets/icons/hand-gold.svg",
                      height: 45.0,
                      width: 45.0,
                      colorFilter: ColorFilter.mode(
                        CustomColors.mainColor,
                        BlendMode.srcIn,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(left: 32.0, right: 32.0, top: 16.0),
                      child: Text(
                        "Та биетээр авах алтны хэмжээгээ оруулна уу.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 16.0,
                        ),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(left: 32.0, right: 32.0, top: 16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline, color: Colors.amber, size: 18.0),
                          SizedBox(width: 8.0),
                          Expanded(
                            child: Text(
                              "100гр-аас дээш биетээр авах хүсэлт илгээвэл ажлын 5 хоногт багтаан таны хүсэлтийг шийдвэрлэхийг анхаарна уу.",
                              style: TextStyle(
                                color: Colors.white54,
                                fontSize: 13.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        "${quantityText}гр",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: "InterBold",
                          fontSize: 24.0,
                          fontWeight: FontWeight.bold,
                          color: CustomColors.mainColor,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(
                          left: 16.0, top: 0.0, right: 16.0, bottom: 16.0),
                      child: Container(
                        width: MediaQuery.of(context).size.width,
                        height: 0.9,
                        color: Colors.white12,
                      ),
                    ),
                    NumericKeyboard(
                      onKeyboardTap: _onKeyboardTap,
                      textStyle: const TextStyle(
                        fontSize: 25.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      rightButtonFn: () {
                        if (quantityText.isEmpty) return;
                        setState(() {
                          if (quantityText.length == 1) {
                            quantityText = "0";
                          } else {
                            quantityText = quantityText.substring(0, quantityText.length - 1);
                          }
                        });
                      },
                      rightButtonLongPressFn: () {
                        if (quantityText.isEmpty) return;
                        setState(() {
                          quantityText = '0';
                        });
                      },
                      rightIcon: const Icon(Ionicons.backspace_outline),
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    ),
                    Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: MainButton(
                        title: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Үргэлжлүүлэх",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                        onPress: () {
                          final qty = num.tryParse(quantityText) ?? 0;
                          if (qty <= 0) {
                            showAlertPopUpDialog(context, "Тоо хэмжээ 0-ээс их байх ёстой.", 75);
                          } else {
                            // Check metal balance
                            final userBalance = _metalId == 1 
                                ? widget.userModel.balance.gold
                                : widget.userModel.balance.silver;
                            
                            if (qty > userBalance) {
                              showAlertPopUpDialog(
                                context, 
                                "Таны ${_metalId == 1 ? 'алтны' : 'мөнгөний'} үлдэгдэл хэмжээ хүрэлцэхгүй байна.", 
                                85
                              );
                            } else {
                              pageController.animateToPage(
                                2,
                                duration: const Duration(milliseconds: 100),
                                curve: Curves.easeIn,
                              );
                            }
                          }
                        },
                        isLoading: loading,
                      ),
                    ),
                  ],
                ),
              ),

              // Page 2: PIN Confirmation
              SafeArea(
                child: Column(
                  children: [
                    Expanded(
                      child: ListView(
                        children: [
                          const SizedBox(height: 40),
                          SvgPicture.asset(
                            "assets/icons/shield-check.svg",
                            height: 45.0,
                            width: 45.0,
                            colorFilter: ColorFilter.mode(
                              CustomColors.mainColor,
                              BlendMode.srcIn,
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.only(left: 32.0, right: 32.0, top: 16.0),
                            child: Text(
                              "Та пин кодоо оруулж баталгаажуулна уу.",
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white54,
                                fontSize: 16.0,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16.0),
                          const Text(
                            'Та пинкодоо оруулна уу',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 10.0, color: Colors.white70),
                          ),
                          const SizedBox(height: 16.0),
                          Center(
                            child: IgnorePointer(
                              ignoring: true, // prevent opening system keyboard
                              child: PinCodeTextField(
                                controller: _pinController,
                                maxLength: 6,
                                autofocus: false,
                                isCupertino: true,
                                hideCharacter: true,
                                highlightColor: CustomColors.mainColor,
                                defaultBorderColor: Colors.white12,
                                pinBoxColor: CustomColors.inputDarkColor,
                                pinBoxRadius: 8.0,
                                pinBoxBorderWidth: 1.0,
                                hasTextBorderColor: CustomColors.mainColor,
                                pinBoxWidth: 40.0,
                                pinBoxHeight: 40.0,
                                onDone: (text) {
                                  // handled by on-screen keyboard
                                },
                                wrapAlignment: WrapAlignment.spaceAround,
                                pinBoxDecoration:
                                    ProvidedPinBoxDecoration.defaultPinBoxDecoration,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16.0),
                          const Divider(
                            color: Colors.white30,
                            height: 1.0,
                          ),
                          NumericKeyboard(
                            onKeyboardTap: _onPinKeyboardTap,
                            textStyle: const TextStyle(fontSize: 24.0, color: Colors.white),
                            rightButtonFn: _onPinBackspace,
                            rightButtonLongPressFn: _onPinClear,
                            rightIcon: const Icon(Icons.backspace, color: Colors.white70),
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: MainButton(
                        title: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Баталгаажуулах",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                        onPress: () {
                          if (_pinController.text.length != 6) {
                            showAlertPopUpDialog(
                              context,
                              "Пин кодоо бүрэн оруулна уу (6 орон).",
                              65,
                            );
                          } else {
                            _submit(context);
                          }
                        },
                        isLoading: loading,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
