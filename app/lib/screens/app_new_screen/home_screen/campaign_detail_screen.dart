import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/elements/app_ui.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/lottery_campaign_models.dart';
import 'package:onegrgold/style/app_text.dart';
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
      backgroundColor: CustomColors.appBackground,
      appBar: appBar(tr('lottery.section_title')),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(
                  color: CustomColors.accent, strokeWidth: 2),
            )
          : campaign == null
              ? const SizedBox.shrink()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: CustomColors.accent,
                  backgroundColor: CustomColors.surface,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    children: [
                      _cover(campaign),
                      const SizedBox(height: 12),
                      _header(campaign),
                      const SizedBox(height: 24),
                      Text(tr('lottery.my_tickets'),
                          style: AppText.sectionTitle),
                      const SizedBox(height: 12),
                      _myTickets(),
                      const SizedBox(height: 24),
                      Text(tr('lottery.winners'), style: AppText.sectionTitle),
                      const SizedBox(height: 12),
                      _drawsList(),
                    ],
                  ),
                ),
    );
  }

  // ---- header ------------------------------------------------------------

  Widget _cover(LotteryCampaignInfo campaign) {
    final url = campaign.coverImage;
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: AspectRatio(
        aspectRatio: 21 / 9,
        child: (url != null && url.isNotEmpty)
            ? Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _coverPlaceholder(),
              )
            : _coverPlaceholder(),
      ),
    );
  }

  Widget _coverPlaceholder() {
    return ColoredBox(
      color: CustomColors.surfaceAlt,
      child: Center(
        child: Icon(Icons.confirmation_number_outlined,
            color: CustomColors.accent.withOpacity(0.35), size: 48),
      ),
    );
  }

  /// Name, days-left chip, rule chips, description and the campaign stats in
  /// one card.
  Widget _header(LotteryCampaignInfo campaign) {
    final rules = _ruleChips(campaign);
    final String? endDate = campaign.endDate == null
        ? null
        : "${campaign.endDate!.year}.${campaign.endDate!.month.toString().padLeft(2, '0')}.${campaign.endDate!.day.toString().padLeft(2, '0')}";
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  campaign.name,
                  style: AppText.sectionTitle.copyWith(height: 1.3),
                ),
              ),
              const SizedBox(width: 10),
              AppStatusChip(
                label: campaign.daysLeft > 0
                    ? tr('lottery.days_left', {'days': campaign.daysLeft})
                    : tr('lottery.ends_today'),
                icon: Icons.schedule_rounded,
              ),
            ],
          ),
          if (rules.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: rules),
          ],
          if (campaign.description.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              campaign.description,
              style: AppText.body.copyWith(color: CustomColors.textSecondary),
            ),
          ],
          const AppDivider(vertical: 10),
          AppInfoRow(
            dense: true,
            icon: Icons.confirmation_number_outlined,
            label: tr('lottery.my_tickets'),
            value: '${_tickets.length}',
            valueColor: CustomColors.accent,
          ),
          // These strings already carry their number/date, so they are shown
          // as one muted line each rather than a label/value pair.
          _infoLine(
            Icons.people_outline_rounded,
            tr('lottery.participants', {'count': campaign.totalParticipants}),
          ),
          if (endDate != null)
            _infoLine(Icons.event_outlined,
                tr('home.lottery_ends_on', {'date': endDate})),
        ],
      ),
    );
  }

  Widget _infoLine(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15.0, color: CustomColors.textSecondary),
          const SizedBox(width: 8.0),
          Expanded(
            child: Text(text, style: AppText.caption.copyWith(fontSize: 13.0)),
          ),
        ],
      ),
    );
  }

  List<Widget> _ruleChips(LotteryCampaignInfo campaign) {
    final labels = <String>[
      if (campaign.ticketsPerUnit > 0)
        tr('lottery.rule_per_unit', {'n': campaign.ticketsPerUnit}),
      if (campaign.signupTickets > 0)
        tr('lottery.rule_signup', {'n': campaign.signupTickets}),
    ];
    return labels
        .map((label) =>
            AppStatusChip(label: label, color: CustomColors.textSecondary))
        .toList();
  }

  // ---- my tickets --------------------------------------------------------

  Widget _myTickets() {
    if (_tickets.isEmpty) {
      return AppCard(
        padding: const EdgeInsets.all(4),
        child: AppEmptyState(
          icon: Icons.confirmation_number_outlined,
          title: tr('lottery.no_tickets_yet'),
        ),
      );
    }
    final rows = <Widget>[];
    for (int i = 0; i < _tickets.length; i++) {
      if (i > 0) rows.add(const AppDivider(vertical: 0));
      rows.add(_ticketRow(_tickets[i]));
    }
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(children: rows),
    );
  }

  Widget _ticketRow(LotteryTicketInfo t) {
    final won = t.isWon;
    final String statusText = won
        ? (t.prize != null && t.prize!.trim().isNotEmpty
            ? tr('lottery.won_prize', {'prize': t.prize})
            : tr('lottery.you_won'))
        : t.isPending
            ? tr('lottery.status_pending')
            : tr('lottery.status_in_draw', {'n': t.drawNumber});

    return AppListRow(
      title: t.code,
      subtitle: statusText,
      leading: AppIconTile(
        size: 40,
        color: won ? CustomColors.accentSoft : null,
        child: Icon(
          won ? Icons.emoji_events_rounded : Icons.confirmation_number_outlined,
          size: 20,
          color: won ? CustomColors.accent : CustomColors.textSecondary,
        ),
      ),
      trailing: won
          ? AppStatusChip(
              label: tr('lottery.you_won'),
              icon: Icons.emoji_events_rounded,
            )
          : null,
    );
  }

  // ---- winners -----------------------------------------------------------

  Widget _drawsList() {
    if (_draws.isEmpty) {
      return AppCard(
        padding: const EdgeInsets.all(4),
        child: AppEmptyState(
          icon: Icons.emoji_events_outlined,
          title: tr('lottery.no_draws_yet'),
        ),
      );
    }
    return Column(
      children: _draws.map(_drawCard).toList(),
    );
  }

  Widget _drawCard(LotteryDrawInfo draw) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    tr('lottery.draw_n', {'n': draw.drawNumber}),
                    style: AppText.bodyBold,
                  ),
                ),
                AppStatusChip(
                  label:
                      tr('lottery.draw_tickets', {'count': draw.ticketCount}),
                  color: CustomColors.textSecondary,
                ),
              ],
            ),
            const AppDivider(vertical: 10),
            if (draw.winners.isEmpty)
              Text(tr('lottery.no_winners_yet'), style: AppText.caption)
            else
              ...draw.winners.map((w) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(
                      children: [
                        Icon(Icons.emoji_events_rounded,
                            size: 14, color: CustomColors.accent),
                        const SizedBox(width: 8),
                        Text(
                          w.ticketCode,
                          style: AppText.bodyBold.copyWith(
                            fontSize: 12.5,
                            color: CustomColors.accent,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            w.displayName,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.caption.copyWith(
                                fontSize: 12.5, color: Colors.white70),
                          ),
                        ),
                        if (w.prize != null && w.prize!.trim().isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              w.prize!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.caption
                                  .copyWith(color: CustomColors.accent),
                            ),
                          ),
                        ],
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
