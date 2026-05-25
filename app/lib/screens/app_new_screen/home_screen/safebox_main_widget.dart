import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/safebox_widget.dart';
import 'package:onegrgold/style/colors.dart';

class SafeboxMainWidget extends StatefulWidget {
  const SafeboxMainWidget({super.key});

  @override
  State<SafeboxMainWidget> createState() => _SafeboxMainWidgetState();
}

class _SafeboxMainWidgetState extends State<SafeboxMainWidget> {
  bool _isSafeOpen = false; // Safe төлөв: false = хаалттай, true = нээлттэй
  double _balance = 0.0; // Investment balance
  bool _isLoadingBalance = true;
  DateTime? _endDate; // Investment end date

  @override
  void initState() {
    super.initState();
    _loadInvestmentBalance();
  }

  Future<void> _loadInvestmentBalance() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final doc = await FirebaseFirestore.instance
            .collection('investments')
            .doc(user.uid)
            .get();
        
        if (doc.exists) {
          final data = doc.data();
          setState(() {
            _balance = (data?['balance'] ?? 0.0).toDouble();
            // endDate field-г timestamp-аас DateTime болгож хөрвүүлэх
            if (data?['endDate'] != null) {
              _endDate = (data!['endDate'] as Timestamp).toDate();
            }
            _isLoadingBalance = false;
          });
        } else {
          setState(() {
            _balance = 0.0;
            _endDate = null;
            _isLoadingBalance = false;
          });
        }
      }
    } catch (e) {
      print('Error loading investment balance: $e');
      setState(() {
        _balance = 0.0;
        _endDate = null;
        _isLoadingBalance = false;
      });
    }
  }

  void _onDialSpin() {
    setState(() {
      _isSafeOpen = !_isSafeOpen;
    });
    print('Safe is now ${_isSafeOpen ? "OPEN" : "CLOSED"}');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
                    padding: EdgeInsets.only(
                        left: 16.0, top: 16.0, bottom: 16.0),
                    child: Text(
                      "Миний сейф",
                      style: TextStyle(
                        fontFamily: "InterBold",
                        fontSize: 14.0,
                      ),
                    ),
                  ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 0.0, horizontal: 16.0),
          child: Center(
            child: Container(
              width: MediaQuery.of(context).size.width / 2 - 24,
              height: 240,
              decoration: BoxDecoration(
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
              child: Stack(
                children: [
                  // Background texture
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: RadialGradient(
                        center: const Alignment(0.3, -0.5),
                        radius: 1.2,
                        colors: [
                          Colors.white.withOpacity(0.1),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                  
                  // Main content
                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CombinationDial(
                          size: 80,
                          tickCount: 40,
                          majorTickEvery: 5,
                          spinTurnsOnTap: 2.0,
                          duration: const Duration(milliseconds: 1200),
                          dialColor: const Color(0xFF1C2333),
                          ringColor: const Color(0xFF2C3750),
                          tickColor: Colors.white60,
                          numberColor: Colors.white,
                          pointerColor: const Color(0xFFFFD166),
                          shadowColor: Colors.black54,
                          onSpinEnd: _onDialSpin, // Callback нэмж байна
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Status indicator
                        Container(
                          width: 150.0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Colors.white24,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: _isSafeOpen ? Colors.green : Colors.red,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: _isSafeOpen ? Colors.green : Colors.red,
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(width: 16),
                              Text(
                                _isLoadingBalance 
                                  ? '...' 
                                  : _isSafeOpen 
                                    ? '${_balance.toStringAsFixed(1)}гр'
                                    : '-',
                                style: TextStyle(
                                  color: CustomColors.mainColor,
                                  fontSize: 12,
                                  fontFamily: "RubikBold"
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Serial number
                        Padding(
                          padding: const EdgeInsets.only(right: 16.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Lottie.asset(
                                'assets/icons/clock.json',
                                width: 14,
                                height: 14,
                                fit: BoxFit.cover,
                                repeat: true,
                                animate: !_isSafeOpen,
                              ),
                              SizedBox(
                                width: 2.0,
                              ),
                              Text(
                                _isLoadingBalance 
                                  ? 'Loading...' 
                                  : _endDate != null
                                    ? '${_endDate!.year}/${_endDate!.month.toString().padLeft(2, '0')}/${_endDate!.day.toString().padLeft(2, '0')}'
                                    : 'Огноо олдсонгүй',
                                style: TextStyle(
                                  color: Colors.white30,
                                  fontSize: 9,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Corner bolts
                  ...List.generate(4, (index) {
                    final positions = [
                      const Alignment(-0.85, -0.85), // top-left
                      const Alignment(0.85, -0.85),  // top-right  
                      const Alignment(-0.85, 0.85),  // bottom-left
                      const Alignment(0.85, 0.85),   // bottom-right
                    ];
                    
                    return Align(
                      alignment: positions[index],
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          gradient: const RadialGradient(
                            colors: [
                              Color(0xFF5A6572),
                              Color(0xFF2C3E50),
                            ],
                          ),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF1A252F),
                            width: 0,
                          ),
                        ),
                        child: Container(
                          margin: const EdgeInsets.all(2),
                          decoration:  BoxDecoration(
                            color: CustomColors.mainColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
