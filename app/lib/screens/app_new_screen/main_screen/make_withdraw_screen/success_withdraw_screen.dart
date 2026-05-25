import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/elements/main_button.dart';
import 'package:onegrgold/models/withdraw_request_response.dart';
import 'package:onegrgold/style/colors.dart';

class SuccessWithdrawScreen extends StatelessWidget {
  const SuccessWithdrawScreen({super.key, required this.withdrawResponse});

  final WithdrawResponse withdrawResponse;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Хүсэлт амжилттай'),
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
                    : 'Таны хүсэлт хянагдаж байна. Баталгаажуулсны дараа таны дансанд орж ирнэ.',
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
                          'Хэмжээ:',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 14.0,
                          ),
                        ),
                        Text(
                          '${withdrawResponse.quantity.toStringAsFixed(0)} гр ${withdrawResponse.metalName.toLowerCase()}',
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
                          'Төлөв:',
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
                              'Хүлээгдэж байна',
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
                        'Та баталгаажуулах кодыг бидэнд мэдэгдэн биетээр авах хүсэлтээ баталгаажуулна уу.',
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
                title: const Text(
                  'Дуусгах',
                  style: TextStyle(
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
