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
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_withdraw_screen/success_withdraw_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_withdraw_screen/make_withdraw_agreement.dart';
import 'package:onegrgold/style/app_text.dart';
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
  int _pageIndex = 0; // Доод товчийг аль хуудсанд байгаагаар солино

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

  /// "гр" / "g" гэх мэт нэгжийг одоо байгаа орчуулгаас салгаж авна
  String get _gramUnit => tr('order.quantity_gram', {'qty': ''}).trim();

  num get _balance => _metalId == 1
      ? widget.userModel.balance.gold
      : widget.userModel.balance.silver;

  String _fmt(num v) =>
      v % 1 == 0 ? v.toStringAsFixed(0) : v.toStringAsFixed(2);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MakeWithdrawRequestBloc, MakeWithdrawRequestState>(
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
        return Scaffold(
          backgroundColor: CustomColors.appBackground,
          appBar: appBar(tr('order.withdraw_request_title')),
          body: PageView(
            controller: pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (i) => setState(() => _pageIndex = i),
            children: [
              // Page 0: Agreement Page
              const Column(children: [MakeWithdrawAgreement()]),
              // Page 1: Quantity Selection
              _quantityPage(),
              // Page 2: PIN Confirmation
              _pinPage(),
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: _bottomBar(context, loading),
            ),
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------- pages

  Widget _quantityPage() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        // Боломжит үлдэгдэл
        AppCard(
          child: Row(
            children: [
              AppIconTile(
                child: SvgPicture.asset(
                  "assets/icons/hand-gold.svg",
                  height: 22.0,
                  width: 22.0,
                  colorFilter: ColorFilter.mode(
                    CustomColors.accent,
                    BlendMode.srcIn,
                  ),
                ),
              ),
              const SizedBox(width: 14.0),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _metalId == 1
                          ? tr('home.metal_gold')
                          : tr('home.metal_silver'),
                      style: AppText.caption,
                    ),
                    const SizedBox(height: 4.0),
                    Text.rich(
                      TextSpan(children: [
                        TextSpan(text: _fmt(_balance)),
                        TextSpan(
                          text: " $_gramUnit",
                          style: AppText.displayUnit
                              .copyWith(color: CustomColors.textSecondary),
                        ),
                      ]),
                      style: AppText.display.copyWith(fontSize: 28.0),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12.0),
        AppBanner(text: tr('order.withdraw_large_amount_note')),
        const SizedBox(height: 12.0),
        // Оруулж буй хэмжээ + тоон гар
        AppCard(
          child: Column(
            children: [
              Text(
                tr('order.withdraw_enter_amount'),
                textAlign: TextAlign.center,
                style: AppText.caption,
              ),
              const SizedBox(height: 10.0),
              Text.rich(
                TextSpan(children: [
                  TextSpan(text: quantityText),
                  TextSpan(
                    text: " $_gramUnit",
                    style: AppText.displayUnit
                        .copyWith(color: CustomColors.accent),
                  ),
                ]),
                textAlign: TextAlign.center,
                style: AppText.display,
              ),
              const AppDivider(vertical: 14.0),
              NumericKeyboard(
                onKeyboardTap: _onKeyboardTap,
                textStyle: AppText.display.copyWith(fontSize: 24.0),
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
                rightIcon: Icon(Ionicons.backspace_outline,
                    color: CustomColors.textSecondary),
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pinPage() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        const SizedBox(height: 16.0),
        Center(
          child: AppIconTile(
            size: 84.0,
            color: CustomColors.accentSoft,
            child: SvgPicture.asset(
              "assets/icons/shield-check.svg",
              height: 40.0,
              width: 40.0,
              colorFilter: ColorFilter.mode(
                CustomColors.accent,
                BlendMode.srcIn,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20.0),
        Text(
          tr('order.pin_confirm_prompt'),
          textAlign: TextAlign.center,
          style: AppText.sectionTitle,
        ),
        const SizedBox(height: 6.0),
        Text(
          tr('order.pin_enter_hint'),
          textAlign: TextAlign.center,
          style: AppText.caption,
        ),
        const SizedBox(height: 20.0),
        AppCard(
          child: Column(
            children: [
              Center(
                child: IgnorePointer(
                  ignoring: true, // prevent opening system keyboard
                  child: PinCodeTextField(
                    controller: _pinController,
                    maxLength: 6,
                    autofocus: false,
                    isCupertino: true,
                    hideCharacter: true,
                    highlightColor: CustomColors.accent,
                    defaultBorderColor: CustomColors.surfaceBorder,
                    pinBoxColor: CustomColors.surfaceAlt,
                    pinBoxRadius: 12.0,
                    pinBoxBorderWidth: 1.0,
                    hasTextBorderColor: CustomColors.accent,
                    pinBoxWidth: 44.0,
                    pinBoxHeight: 48.0,
                    pinTextStyle: AppText.sectionTitle,
                    onDone: (text) {
                      // handled by on-screen keyboard
                    },
                    wrapAlignment: WrapAlignment.spaceAround,
                    pinBoxDecoration:
                        ProvidedPinBoxDecoration.defaultPinBoxDecoration,
                  ),
                ),
              ),
              const AppDivider(vertical: 14.0),
              NumericKeyboard(
                onKeyboardTap: _onPinKeyboardTap,
                textStyle: AppText.display.copyWith(fontSize: 24.0),
                rightButtonFn: _onPinBackspace,
                rightButtonLongPressFn: _onPinClear,
                rightIcon: Icon(Ionicons.backspace_outline,
                    color: CustomColors.textSecondary),
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ------------------------------------------------------------ bottom bar

  Widget _bottomBar(BuildContext context, bool loading) {
    switch (_pageIndex) {
      case 0:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _agreementCheckbox(),
            const SizedBox(height: 8.0),
            AppPrimaryButton(
              label: tr('common.continue'),
              onPressed: () {
                if (!agreementAccepted) {
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
          ],
        );
      case 1:
        return AppPrimaryButton(
          label: tr('common.continue'),
          loading: loading,
          onPressed: () {
            final qty = num.tryParse(quantityText) ?? 0;
            if (qty <= 0) {
              showAlertPopUpDialog(
                  context, tr('order.quantity_must_be_positive'), 75);
            } else {
              // Check metal balance
              final userBalance = _metalId == 1
                  ? widget.userModel.balance.gold
                  : widget.userModel.balance.silver;

              if (qty > userBalance) {
                showAlertPopUpDialog(
                  context,
                  tr('order.insufficient_balance', {
                    'metal': _metalId == 1
                        ? tr('order.metal_gold_genitive')
                        : tr('order.metal_silver_genitive')
                  }),
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
        );
      default:
        return AppPrimaryButton(
          label: tr('common.confirm'),
          loading: loading,
          onPressed: () {
            if (_pinController.text.length != 6) {
              showAlertPopUpDialog(
                context,
                tr('order.pin_incomplete'),
                65,
              );
            } else {
              _submit(context);
            }
          },
        );
    }
  }

  Widget _agreementCheckbox() {
    return Row(
      children: <Widget>[
        SizedBox(
          width: 24.0,
          height: 24.0,
          child: Checkbox(
            activeColor: CustomColors.accent,
            checkColor: Colors.black,
            side: BorderSide(color: CustomColors.textTertiary, width: 1.5),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6.0)),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
            value: agreementAccepted,
            onChanged: (bool? value) {
              setState(() {
                agreementAccepted = value!;
              });
            },
          ),
        ),
        const SizedBox(width: 10.0),
        Expanded(
          child: GestureDetector(
            onTap: () {
              setState(() {
                agreementAccepted = !agreementAccepted;
              });
            },
            child: Text(
              tr('order.accept_terms_checkbox'),
              style: AppText.caption.copyWith(color: Colors.white),
            ),
          ),
        )
      ],
    );
  }
}
