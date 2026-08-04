import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/withdraw_request_response.dart';
import 'package:onegrgold/style/colors.dart';

class SuccessWithdrawScreen extends StatelessWidget {
  const SuccessWithdrawScreen({super.key, required this.withdrawResponse});

  final WithdrawResponse withdrawResponse;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('order.withdraw_success_title')),
        backgroundColor: CustomColors.scaffoldDarkBack,
        automaticallyImplyLeading: false,
      ),
      backgroundColor: CustomColors.scaffoldDarkBack,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Success Animation
              Lottie.asset(
                'assets/icons/gold.json',
                width: 120,
                height: 120,
                repeat: true,
                
              ),
              const SizedBox(height: 32),
              
              // Success Message
              Text(
                withdrawResponse.message.isNotEmpty 
                    ? withdrawResponse.message
                    : tr('order.withdraw_success_message'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 16.0,
                ),
              ),
              const SizedBox(height: 32),

              // Request Details
              Container(
                padding: const EdgeInsets.all(20.0),
                decoration: BoxDecoration(
                  color: Colors.grey.shade900,
                  borderRadius: BorderRadius.circular(16.0),
                ),
                child: Column(
                  children: [
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          tr('order.quantity_label'),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 14.0,
                          ),
                        ),
                        Text(
                          tr('order.quantity_gram_metal', {
                            'qty': withdrawResponse.quantity.toStringAsFixed(0),
                            'metal': withdrawResponse.metalName.toLowerCase()
                          }),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14.0,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          tr('order.status_label'),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 14.0,
                          ),
                        ),
                        Row(
                          children: [
                            Icon(
                              Ionicons.time_outline,
                              color: Colors.orange,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              tr('common.pending'),
                              style: const TextStyle(
                                color: Colors.orange,
                                fontSize: 14.0,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Information
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: Colors.blue.shade900.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Row(
                  children: [
                    Icon(
                      Ionicons.information_circle,
                      color: Colors.blue.shade300,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        tr('order.withdraw_confirm_code_note'),
                        style: TextStyle(
                          color: Colors.blue.shade300,
                          fontSize: 14.0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Done Button
              MainButton(
                title: Text(
                  tr('order.finish'),
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onPress: () {
                  // Navigate back to home or main screen
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                isLoading: false,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
