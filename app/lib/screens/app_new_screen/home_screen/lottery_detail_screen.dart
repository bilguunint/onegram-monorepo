import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/style/colors.dart';
import 'package:onegrgold/l10n/app_locale.dart';

class LotteryDetailScreen extends StatefulWidget {
  final String name;
  final String? description;
  final DateTime? endDate;

  const LotteryDetailScreen({
    super.key,
    required this.name,
    this.description,
    this.endDate,
  });

  @override
  State<LotteryDetailScreen> createState() => _LotteryDetailScreenState();
}

class _LotteryDetailScreenState extends State<LotteryDetailScreen> {
  List<String> _ticketCodes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  Future<void> _fetchTickets() async {
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) {
        setState(() => _loading = false);
        return;
      }
      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .collection('lottery_tickets')
          .get();
      setState(() {
        _ticketCodes = snapshot.docs
            .map((doc) => doc.data()['ticket_code'] as String? ?? '')
            .where((code) => code.isNotEmpty)
            .toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final daysLeft = widget.endDate != null
        ? widget.endDate!.difference(DateTime.now()).inDays
        : null;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        title: Text(tr('home.promotion'),
            style: const TextStyle(fontFamily: "InterBold", fontSize: 16)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Campaign header
            Center(
              child: SizedBox(
                height: 120,
                child: Lottie.asset('assets/icons/golden_ticket.json', repeat: false),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: Text(
                widget.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: "InterBold",
                  fontSize: 18.0,
                  color: Colors.white,
                ),
              ),
            ),
            if (daysLeft != null) ...[
              const SizedBox(height: 8),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Lottie.asset('assets/icons/clock.json', width: 20, height: 20),
                    const SizedBox(width: 4),
                    Text(
                      tr('home.days_left', {'days': daysLeft}),
                      style: TextStyle(
                        fontSize: 13.0,
                        fontWeight: FontWeight.bold,
                        color: CustomColors.mainColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (widget.endDate != null) ...[
              const SizedBox(height: 4),
              Center(
                child: Text(
                  tr('home.lottery_ends_on', {
                    'date':
                        "${widget.endDate!.year}.${widget.endDate!.month.toString().padLeft(2, '0')}.${widget.endDate!.day.toString().padLeft(2, '0')}"
                  }),
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ),
            ],

            // Description
            if (widget.description != null) ...[
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C2333),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: Text(
                  widget.description!,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13.0,
                    height: 1.6,
                  ),
                ),
              ),
            ],

            // Tickets section
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  tr('home.my_tickets'),
                  style: const TextStyle(
                    fontFamily: "InterBold",
                    fontSize: 14.0,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: CustomColors.mainColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_ticketCodes.length}',
                    style: TextStyle(
                      color: CustomColors.mainColor,
                      fontSize: 12,
                      fontFamily: "RubikBold",
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_ticketCodes.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C2333),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: Center(
                  child: Text(
                    tr('home.no_tickets'),
                    style: const TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _ticketCodes.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1C2333),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.confirmation_number_outlined,
                            color: CustomColors.mainColor, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          _ticketCodes[index],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontFamily: "RubikBold",
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
