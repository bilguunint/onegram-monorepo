import 'package:cloud_firestore/cloud_firestore.dart';

/// A lottery campaign written under the current admin rules
/// (`schema_version == 2`). The two campaigns that predate them carry
/// different fields and are archive-only, so the app treats them as absent.
class LotteryCampaignInfo {
  final String id;
  final String name;
  final String description;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? coverImage; // 21:9
  final String? campaignImage; // 3:4
  final int ticketsPerUnit; // per 0.1g of gold
  final int signupTickets;
  final int totalParticipants;
  final int totalTickets;
  final int drawCount;
  final LotteryPopupInfo popup;

  const LotteryCampaignInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.startDate,
    required this.endDate,
    required this.coverImage,
    required this.campaignImage,
    required this.ticketsPerUnit,
    required this.signupTickets,
    required this.totalParticipants,
    required this.totalTickets,
    required this.drawCount,
    required this.popup,
  });

  static LotteryCampaignInfo fromDoc(
      String id, Map<String, dynamic> data) {
    DateTime? asDate(dynamic v) => v is Timestamp ? v.toDate() : null;
    return LotteryCampaignInfo(
      id: id,
      name: (data['name'] as String?) ?? '',
      description: (data['description'] as String?) ?? '',
      startDate: asDate(data['start_date']),
      endDate: asDate(data['end_date']),
      coverImage: data['cover_image'] as String?,
      campaignImage: data['campaign_image'] as String?,
      ticketsPerUnit: (data['tickets_per_unit'] as num?)?.toInt() ?? 0,
      signupTickets: (data['signup_tickets'] as num?)?.toInt() ?? 0,
      totalParticipants: (data['total_participants'] as num?)?.toInt() ?? 0,
      totalTickets: (data['total_tickets'] as num?)?.toInt() ?? 0,
      drawCount: (data['draw_count'] as num?)?.toInt() ?? 0,
      popup: LotteryPopupInfo(
        enabled: data['modal_enabled'] == true,
        image: data['modal_image'] as String?,
        title: (data['modal_title'] as String?) ?? '',
        body: (data['modal_body'] as String?) ?? '',
      ),
    );
  }

  int get daysLeft {
    final end = endDate;
    if (end == null) return 0;
    final d = end.difference(DateTime.now()).inDays;
    return d < 0 ? 0 : d;
  }

  /// The one active, in-window, current-schema campaign, or null.
  static Future<LotteryCampaignInfo?> fetchActive() async {
    final snap = await FirebaseFirestore.instance
        .collection('marketing_campaigns')
        .where('status', isEqualTo: 'active')
        .where('schema_version', isEqualTo: 2)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) return null;
    final c = LotteryCampaignInfo.fromDoc(
        snap.docs.first.id, snap.docs.first.data());
    final now = DateTime.now();
    // The hourly closer lags a little; don't show a campaign past its end.
    if (c.startDate != null && now.isBefore(c.startDate!)) return null;
    if (c.endDate != null && now.isAfter(c.endDate!)) return null;
    return c;
  }
}

class LotteryPopupInfo {
  final bool enabled;
  final String? image; // 16:9
  final String title;
  final String body;

  const LotteryPopupInfo({
    required this.enabled,
    required this.image,
    required this.title,
    required this.body,
  });

  bool get hasContent =>
      enabled &&
      ((image != null && image!.isNotEmpty) ||
          title.trim().isNotEmpty ||
          body.trim().isNotEmpty);
}

/// One of the user's own tickets, from `users/{uid}/lottery_tickets`.
class LotteryTicketInfo {
  final String code;
  /// Null while the ticket is still waiting for the next draw.
  final int? drawNumber;
  final String status; // active | drawn | won
  final String? prize;

  const LotteryTicketInfo({
    required this.code,
    required this.drawNumber,
    required this.status,
    required this.prize,
  });

  bool get isWon => status == 'won';
  bool get isPending => drawNumber == null;

  static Future<List<LotteryTicketInfo>> fetchMine(
      String uid, String campaignId) async {
    final snap = await FirebaseFirestore.instance
        .collection('users')
        .doc(uid)
        .collection('lottery_tickets')
        .where('campaign_id', isEqualTo: campaignId)
        .get();
    final list = snap.docs.map((d) {
      final v = d.data();
      return LotteryTicketInfo(
        code: (v['ticket_code'] as String?) ?? '',
        drawNumber: (v['draw_number'] as num?)?.toInt(),
        status: (v['status'] as String?) ?? 'active',
        prize: v['prize'] as String?,
      );
    }).where((t) => t.code.isNotEmpty).toList();
    // Wins first, then the live pool, then settled draws newest-first.
    int rank(LotteryTicketInfo t) => t.isWon ? 0 : (t.isPending ? 1 : 2);
    list.sort((a, b) {
      final r = rank(a).compareTo(rank(b));
      if (r != 0) return r;
      return (b.drawNumber ?? 0).compareTo(a.drawNumber ?? 0);
    });
    return list;
  }
}

/// A settled draw and its announced winners — world-readable, so the app can
/// show every campaign's winners.
class LotteryDrawInfo {
  final int drawNumber;
  final int ticketCount;
  final DateTime? startedAt;
  final List<LotteryWinnerInfo> winners;

  const LotteryDrawInfo({
    required this.drawNumber,
    required this.ticketCount,
    required this.startedAt,
    required this.winners,
  });

  static Future<List<LotteryDrawInfo>> fetchAll(String campaignId) async {
    final snap = await FirebaseFirestore.instance
        .collection('marketing_campaigns')
        .doc(campaignId)
        .collection('draws')
        .get();
    final list = snap.docs.map((d) {
      final v = d.data();
      final winners = (v['winners'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(LotteryWinnerInfo.fromMap)
          .toList();
      return LotteryDrawInfo(
        drawNumber: (v['draw_number'] as num?)?.toInt() ?? 0,
        ticketCount: (v['ticket_count'] as num?)?.toInt() ?? 0,
        startedAt:
            v['started_at'] is Timestamp ? (v['started_at'] as Timestamp).toDate() : null,
        winners: winners,
      );
    }).toList()
      ..sort((a, b) => b.drawNumber.compareTo(a.drawNumber));
    return list;
  }
}

class LotteryWinnerInfo {
  final String userId;
  final String userName;
  final String ticketCode;
  final String? prize;

  const LotteryWinnerInfo({
    required this.userId,
    required this.userName,
    required this.ticketCode,
    required this.prize,
  });

  static LotteryWinnerInfo fromMap(Map<String, dynamic> m) {
    return LotteryWinnerInfo(
      userId: (m['user_id'] as String?) ?? '',
      userName: (m['user_name'] as String?) ?? '',
      ticketCode: (m['ticket_code'] as String?) ?? '',
      prize: m['prize'] as String?,
    );
  }

  /// "Батболд Сүхбат" → "Б. Сүхбат" — winners are public, full names are not.
  String get displayName {
    final parts =
        userName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.length < 2) return userName;
    return '${parts.first[0]}. ${parts.sublist(1).join(' ')}';
  }
}
