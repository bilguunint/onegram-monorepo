import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/style/colors.dart';

/// The campaign screen: cover, rules, the user's own tickets grouped by state
/// (won first, then waiting, then settled draws), and the winners of every
/// draw announced so far.
class CampaignDetailScreen extends StatefulWidget {
  final String campaignId;

  const CampaignDetailScreen({super.key, required this.campaignId});

  @override
  State<CampaignDetailScreen> createState() => _CampaignDetailScreenState();
}

class _CampaignDetailScreenState extends State<CampaignDetailScreen> {
  LotteryCampaignInfo? _campaign;
  List<LotteryTicketInfo> _tickets = const [];
  List<LotteryDrawInfo> _draws = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('marketing_campaigns')
          .doc(widget.campaignId)
          .get();
      if (!doc.exists) {
        if (mounted) setState(() => _loading = false);
        return;
      }
      final campaign = LotteryCampaignInfo.fromDoc(doc.id, doc.data()!);
      final uid = FirebaseAuth.instance.currentUser?.uid;
      final results = await Future.wait([
        uid != null
            ? LotteryTicketInfo.fetchMine(uid, campaign.id)
            : Future.value(const <LotteryTicketInfo>[]),
        LotteryDrawInfo.fetchAll(campaign.id),
      ]);
      if (!mounted) return;
      setState(() {
        _campaign = campaign;
        _tickets = results[0] as List<LotteryTicketInfo>;
        _draws = results[1] as List<LotteryDrawInfo>;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final campaign = _campaign;
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        title: Text(tr('lottery.section_title'),
            style: const TextStyle(fontFamily: "InterBold", fontSize: 16)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : campaign == null
              ? const SizedBox.shrink()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: CustomColors.mainColor,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 32),
                    children: [
                      _cover(campaign),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _header(campaign),
                            const SizedBox(height: 12),
                            _rules(campaign),
                            if (campaign.description.trim().isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Text(
                                campaign.description,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
                                  height: 1.5,
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),
                            _sectionTitle(tr('lottery.my_tickets')),
                            const SizedBox(height: 10),
                            _myTickets(),
                            const SizedBox(height: 24),
                            _sectionTitle(tr('lottery.winners')),
                            const SizedBox(height: 10),
                            _drawsList(),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  // ---- header ------------------------------------------------------------

  Widget _cover(LotteryCampaignInfo campaign) {
    final url = campaign.coverImage;
    return AspectRatio(
      aspectRatio: 21 / 9,
      child: (url != null && url.isNotEmpty)
          ? Image.network(
              url,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _coverPlaceholder(),
            )
          : _coverPlaceholder(),
    );
  }

  Widget _coverPlaceholder() {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2A2410), Color(0xFF161618)],
        ),
      ),
      child: Center(
        child: Icon(Icons.confirmation_number_outlined,
            color: CustomColors.mainColor.withOpacity(0.35), size: 48),
      ),
    );
  }

  Widget _header(LotteryCampaignInfo campaign) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                campaign.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: "InterBold",
                  fontSize: 17,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                tr('lottery.participants',
                    {'count': campaign.totalParticipants}),
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: CustomColors.mainColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            campaign.daysLeft > 0
                ? tr('lottery.days_left', {'days': campaign.daysLeft})
                : tr('lottery.ends_today'),
            style: TextStyle(
              color: CustomColors.mainColor,
              fontSize: 11,
              fontFamily: "RubikBold",
            ),
          ),
        ),
      ],
    );
  }

  Widget _rules(LotteryCampaignInfo campaign) {
    final chips = <String>[
      if (campaign.ticketsPerUnit > 0)
        tr('lottery.rule_per_unit', {'n': campaign.ticketsPerUnit}),
      if (campaign.signupTickets > 0)
        tr('lottery.rule_signup', {'n': campaign.signupTickets}),
    ];
    if (chips.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: chips
          .map((label) => Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white12),
                ),
                child: Text(
                  label,
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ))
          .toList(),
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white,
        fontFamily: "InterBold",
        fontSize: 14,
      ),
    );
  }

  // ---- my tickets --------------------------------------------------------

  Widget _myTickets() {
    if (_tickets.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white10),
        ),
        child: Text(
          tr('lottery.no_tickets_yet'),
          style: const TextStyle(
              color: Colors.white54, fontSize: 12, height: 1.5),
          textAlign: TextAlign.center,
        ),
      );
    }
    return Column(
      children: _tickets.map(_ticketRow).toList(),
    );
  }

  Widget _ticketRow(LotteryTicketInfo t) {
    final won = t.isWon;
    final Color border =
        won ? CustomColors.mainColor.withOpacity(0.7) : Colors.white12;
    final String statusText = won
        ? (t.prize != null && t.prize!.trim().isNotEmpty
            ? tr('lottery.won_prize', {'prize': t.prize})
            : tr('lottery.you_won'))
        : t.isPending
            ? tr('lottery.status_pending')
            : tr('lottery.status_in_draw', {'n': t.drawNumber});

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: won
            ? CustomColors.mainColor.withOpacity(0.10)
            : Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Icon(
            won
                ? Icons.emoji_events_rounded
                : Icons.confirmation_number_outlined,
            size: 18,
            color: won ? CustomColors.mainColor : Colors.white38,
          ),
          const SizedBox(width: 10),
          Text(
            t.code,
            style: TextStyle(
              color: won ? CustomColors.mainColor : Colors.white,
              fontSize: 14,
              fontFamily: "RubikBold",
              letterSpacing: 2,
            ),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              statusText,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: won ? CustomColors.mainColor : Colors.white54,
                fontSize: 10.5,
                fontWeight: won ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---- winners -----------------------------------------------------------

  Widget _drawsList() {
    if (_draws.isEmpty) {
      return Text(
        tr('lottery.no_draws_yet'),
        style: const TextStyle(color: Colors.white38, fontSize: 12),
      );
    }
    return Column(
      children: _draws.map(_drawCard).toList(),
    );
  }

  Widget _drawCard(LotteryDrawInfo draw) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                tr('lottery.draw_n', {'n': draw.drawNumber}),
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: "InterBold",
                  fontSize: 12.5,
                ),
              ),
              const Spacer(),
              Text(
                tr('lottery.draw_tickets', {'count': draw.ticketCount}),
                style: const TextStyle(color: Colors.white38, fontSize: 10.5),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (draw.winners.isEmpty)
            Text(
              tr('lottery.no_winners_yet'),
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            )
          else
            ...draw.winners.map((w) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      Icon(Icons.emoji_events_rounded,
                          size: 14, color: CustomColors.mainColor),
                      const SizedBox(width: 8),
                      Text(
                        w.ticketCode,
                        style: TextStyle(
                          color: CustomColors.mainColor,
                          fontSize: 12,
                          fontFamily: "RubikBold",
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          w.displayName,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 12),
                        ),
                      ),
                      if (w.prize != null && w.prize!.trim().isNotEmpty)
                        Text(
                          w.prize!,
                          style: const TextStyle(
                              color: Colors.white54, fontSize: 11),
                        ),
                    ],
                  ),
                )),
        ],
      ),
    );
  }
}
