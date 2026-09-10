import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/style/app_text.dart';
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
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('home.promotion')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Campaign header
            AppCard(
              child: Column(
                children: [
                  SizedBox(
                    height: 120,
                    child: Lottie.asset('assets/icons/golden_ticket.json',
                        repeat: false),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.name,
                    textAlign: TextAlign.center,
                    style: AppText.title.copyWith(fontSize: 20.0),
                  ),
                  if (daysLeft != null) ...[
                    const SizedBox(height: 10),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Lottie.asset('assets/icons/clock.json',
                            width: 20, height: 20),
                        const SizedBox(width: 4),
                        AppStatusChip(
                          label: tr('home.days_left', {'days': daysLeft}),
                        ),
                      ],
                    ),
                  ],
                  if (widget.endDate != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      tr('home.lottery_ends_on', {
                        'date':
                            "${widget.endDate!.year}.${widget.endDate!.month.toString().padLeft(2, '0')}.${widget.endDate!.day.toString().padLeft(2, '0')}"
                      }),
                      textAlign: TextAlign.center,
                      style: AppText.caption,
                    ),
                  ],
                ],
              ),
            ),

            // Description
            if (widget.description != null) ...[
              const SizedBox(height: 12),
              AppCard(
                child: Text(
                  widget.description!,
                  style: AppText.body
                      .copyWith(color: CustomColors.textSecondary, height: 1.6),
                ),
              ),
            ],

            // Tickets section
            const SizedBox(height: 24),
            Row(
              children: [
                Text(tr('home.my_tickets'), style: AppText.sectionTitle),
                const SizedBox(width: 8),
                AppStatusChip(label: '${_ticketCodes.length}'),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading)
              Center(
                child: CircularProgressIndicator(
                    color: CustomColors.accent, strokeWidth: 2),
              )
            else if (_ticketCodes.isEmpty)
              AppCard(
                padding: const EdgeInsets.all(4),
                child: AppEmptyState(
                  icon: Icons.confirmation_number_outlined,
                  title: tr('home.no_tickets'),
                ),
              )
            else
              AppCard(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _ticketCodes.length,
                  separatorBuilder: (_, __) => const AppDivider(vertical: 0),
                  itemBuilder: (context, index) {
                    return AppListRow(
                      title: _ticketCodes[index],
                      leading: AppIconTile(
                        size: 40,
                        color: CustomColors.accentSoft,
                        child: Icon(Icons.confirmation_number_outlined,
                            color: CustomColors.accent, size: 20),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
