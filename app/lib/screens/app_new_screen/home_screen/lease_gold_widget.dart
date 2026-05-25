import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/style/colors.dart';

class LeaseGoldWidget extends StatelessWidget {
  const LeaseGoldWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
                    padding: EdgeInsets.only(
                        top: 16.0, bottom: 16.0),
                    child: Text(
                      "Зээлийн үйлчилгээ",
                      style: TextStyle(
                        fontFamily: "InterBold",
                        fontSize: 14.0,
                      ),
                    ),
                  ),
        GestureDetector(
          onTap: () {
            showDialog(
              context: context,
              builder: (_) => AlertDialog(
                backgroundColor: CustomColors.darkContainerColor,
                title: const Text(
                  'Зээлийн үйлчилгээ',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'InterBold',
                  ),
                ),
                content: const Text(
                  'Алтаа барьцаалаад зээл авах боломж тун удахгүй нээгдэнэ. Манай шинэ үйлчилгээг хүлээж байгаарай!',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13.0,
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text(
                      'Ойлголоо',
                      style: TextStyle(
                        color: CustomColors.mainColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
          child: Stack(
          children: [
            Container(
              width: MediaQuery.of(context).size.width / 2 - 24,
                      height: 240,
              
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                image: const DecorationImage(
                  image: AssetImage('assets/images/coin_background.jpg'),
                  fit: BoxFit.cover,
                ),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color.fromARGB(255, 13, 17, 21),
                    Color.fromARGB(255, 15, 17, 20),
                    Color.fromARGB(255, 9, 19, 28),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 20,
                    spreadRadius: 5,
                    offset: const Offset(0, 10),
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 40,
                    spreadRadius: 0,
                    offset: const Offset(0, 20),
                  ),
                ],
                border: Border.all(
                  color: const Color(0xFF455A64),
                  width: 2,
                ),
              ),
              
            ),
             /* Positioned(
              left: 0.0,
              right: 0.0,
              top: 10.0,
              child: SizedBox(
              height: 120,
              child: Image.asset('assets/images/goldbar_black.png'))), */
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withOpacity(0.6),
                        Colors.black.withOpacity(1.0),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.5, 1.0],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 20,
                    spreadRadius: 5,
                    offset: const Offset(0, 10),
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 40,
                    spreadRadius: 0,
                    offset: const Offset(0, 20),
                  ),
                ],
                border: Border.all(
                  color: const Color(0xFF455A64),
                  width: 2,
                ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 0,
              top: 40,
              right: 0.0,
              child: SizedBox(
              height: 80,
              child: Image.asset('assets/images/cash_black.png'))),

             Positioned(
              bottom: 20.0,
              right: 16.0,
              left: 16.0,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      Text("COMING SOON...", style: TextStyle(
                                    fontSize: 9.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white54
                                  ),),
                    ],
                  ),
            SizedBox(height: 4.0),
                  Text("Алтаа барьцаалаад зээлээ ав", style: TextStyle(
                  fontSize: 12.0,
                  fontWeight: FontWeight.bold,
                  color: Colors.white
                              ),),
                ],
              )),
          ],
        ),
        ),
      ],
    );
  }
}