import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_bloc.dart';
import 'package:onegrgold/bloc/send_gift/send_gift_bloc.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_order_screen/make_order_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/make_withdraw_screen/make_withdraw_screen.dart';
import 'package:onegrgold/screens/app_new_screen/main_screen/send_gift_screen/send_gift_screen.dart';
import 'package:onegrgold/style/app_text.dart';
import 'package:onegrgold/style/colors.dart';

/// Wave картын доорх 4 үндсэн үйлдэл — Radianpay-ийн
/// Deposit / Transfers / Withdraw / More мөр: line icon + шошго.
class HomeActionBar extends StatelessWidget {
  const HomeActionBar({super.key, required this.userModel});

  final UserModel userModel;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(vertical: 18.0, horizontal: 4.0),
      child: Row(
        children: [
          _Action(
            asset: "assets/icons/gold-bars-plus.svg",
            label: tr('home.action_order'),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => MakeOrderScreen(
                  userRepository: context.read<UserRepository>(),
                  uid: userModel.uid,
                  metalId: 1, // Gold by default
                ),
              ),
            ),
          ),
          _Action(
            asset: "assets/icons/gift-duotone.svg",
            label: tr('home.action_gift'),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider(
                  create: (_) => SendGiftBloc(
                    userRepository: context.read<UserRepository>(),
                  ),
                  child: SendGiftScreen(userModel: userModel),
                ),
              ),
            ),
          ),
          _Action(
            asset: "assets/icons/hand-holding-dollar-circle.svg",
            label: tr('home.action_withdraw'),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider(
                  create: (_) => MakeWithdrawRequestBloc(),
                  child: MakeWithdrawScreen(userModel: userModel),
                ),
              ),
            ),
          ),
          _Action(
            asset: "assets/icons/coin-card-transfer.svg",
            label: tr('home.action_loan'),
            onTap: () => _showLoanComingSoon(context),
          ),
        ],
      ),
    );
  }

  void _showLoanComingSoon(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AppDialog(
        icon: Icons.schedule_rounded,
        title: tr('home.loan_service'),
        message: tr('home.loan_coming_soon_body'),
        primaryLabel: tr('home.got_it'),
        onPrimary: () => Navigator.of(context).pop(),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({
    this.icon,
    this.asset,
    required this.label,
    required this.onTap,
  }) : assert(icon != null || asset != null);

  final IconData? icon;
  final String? asset;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14.0),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (asset != null)
                // Duotone SVG: өөрийн өнгөтэй тул tint хийхгүй
                SvgPicture.asset(asset!, height: 28.0, width: 28.0)
              else
                Icon(icon, size: 28.0, color: Colors.white),
              const SizedBox(height: 10.0),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: AppText.medium,
                  fontSize: 10.0,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
