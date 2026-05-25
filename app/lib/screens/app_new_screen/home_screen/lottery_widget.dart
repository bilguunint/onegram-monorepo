import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/screens/app_new_screen/home_screen/lottery_detail_screen.dart';
import 'package:onegrgold/style/colors.dart';

class LotteryWidget extends StatefulWidget {
  const LotteryWidget({super.key});

  @override
  State<LotteryWidget> createState() => _LotteryWidgetState();
}

class _LotteryWidgetState extends State<LotteryWidget> {
  String? _name;
  String? _description;
  DateTime? _endDate;
  int _ticketCount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchActiveCampaign();
    _fetchTicketCount();
  }

  Future<void> _fetchActiveCampaign() async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('marketing_campaigns')
          .where('status', isEqualTo: 'active')
          .limit(1)
          .get();

      if (snapshot.docs.isNotEmpty) {
        final data = snapshot.docs.first.data();
        setState(() {
          _name = data['name'] as String?;
          _description = data['description'] as String?;
          _endDate = (data['end_date'] as Timestamp?)?.toDate();
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchTicketCount() async {
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) return;
      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .collection('lottery_tickets')
          .count()
          .get();
      setState(() {
        _ticketCount = snapshot.count ?? 0;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox.shrink();
    }
    if (_name == null) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
          child: Text(
            "Урамшуулал",
            style: TextStyle(
              fontFamily: "InterBold",
              fontSize: 14.0,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 0.0, horizontal: 16.0),
          child: Center(
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LotteryDetailScreen(
                      name: _name!,
                      description: _description,
                      endDate: _endDate,
                    ),
                  ),
                );
              },
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
                  Container(
                    width: MediaQuery.of(context).size.width / 2 - 24,
                    height: 240,
                    padding: const EdgeInsets.all(16.0),
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
                    ),
                  ),
                  /* Positioned(
              left: 0.0,
              right: 0.0,
              top: 10.0,
              child: SizedBox(
              height: 120,
              child: Image.asset('assets/images/goldbar_black.png'))), */
                  Positioned(
                    right: 10.0,
                    top: 10.0,
                    child: Row(
                            children: [
                              Lottie.asset('assets/icons/clock.json',
                                  width: 20, height: 20),
                              SizedBox(width: 4.0),
                              Text(
                                _endDate != null
                                    ? "${_endDate!.difference(DateTime.now()).inDays} өдөр үлдсэн"
                                    : "COMING SOON...",
                                style: const TextStyle(
                                  fontSize: 9.0,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white54,
                                ),
                              ),
                            ],
                          ),
                  ),
                  Positioned(
                      bottom: 20.0,
                      right: 16.0,
                      left: 16.0,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          SizedBox(
                              height: 100,
                              child: Lottie.asset(
                                  'assets/icons/golden_ticket.json',
                                  repeat: false)),
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
                                Text(
                                  'Нийт сугалаа: ',
                                  style: TextStyle(
                                      color: CustomColors.mainColor,
                                      fontSize: 12,
                                      fontFamily: "RubikBold"),
                                ),
                                SizedBox(width: 16),
                                Text(
                                  '$_ticketCount',
                                  style: TextStyle(
                                      color: CustomColors.mainColor,
                                      fontSize: 12,
                                      fontFamily: "RubikBold"),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16.0),
                          Text(
                            _name ?? "",
                            style: TextStyle(
                                fontSize: 12.0,
                                fontWeight: FontWeight.bold,
                                color: Colors.white),
                          ),
                        ],
                      )),
                ],
              ),
            ),
            ),
          ),
        ),
      ],
    );
  }
}
