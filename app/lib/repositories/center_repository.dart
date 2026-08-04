import 'dart:async';
import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/center_models.dart';
import 'package:onegrgold/models/make_order_model.dart';

/// Result of creating a donation QPay invoice.
class CenterCheckout {
  final String pendingId;
  final int amount;
  final MakeOrder invoice;
  const CenterCheckout({
    required this.pendingId,
    required this.amount,
    required this.invoice,
  });
}

class CenterRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  static const _createDonationUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/createCenterDonation';

  /// Live campaign config (cover, target, raised, donor count, status…).
  Stream<CenterCampaignInfo> watchCampaign() {
    return _db
        .collection('center_campaign')
        .doc('main')
        .snapshots()
        .map((s) => CenterCampaignInfo.fromMap(s.data()));
  }

  /// Active products for the storefront grid.
  Stream<List<CenterProductItem>> watchActiveProducts() {
    return _db
        .collection('center_products')
        .where('status', isEqualTo: 'active')
        .snapshots()
        .map((s) => s.docs.map(CenterProductItem.fromDoc).toList());
  }

  /// Active trees for the planting campaign, oldest first so the curated
  /// order inside each category stays stable.
  Stream<List<CenterTreeItem>> watchActiveTrees() {
    return _db
        .collection('center_trees')
        .where('status', isEqualTo: 'active')
        .snapshots()
        .map((s) {
      final list = s.docs.map(CenterTreeItem.fromDoc).toList();
      list.sort((a, b) {
        final ad = a.createdAt;
        final bd = b.createdAt;
        if (ad == null && bd == null) return 0;
        if (ad == null) return 1;
        if (bd == null) return -1;
        return ad.compareTo(bd);
      });
      return list;
    });
  }

  /// Public donor-wall leaderboard, highest cumulative first.
  Stream<List<CenterTopDonor>> watchTopDonors({int limit = 99}) {
    return _db
        .collection('center_campaign')
        .doc('main')
        .collection('donors')
        .orderBy('amount', descending: true)
        .limit(limit)
        .snapshots()
        .map((s) => s.docs.map(CenterTopDonor.fromDoc).toList());
  }

  /// The current user's donation orders (sorted client-side to avoid a
  /// composite index on buyer_uid + created_at).
  Stream<List<CenterDonationOrder>> watchMyDonations(String uid) {
    return _db
        .collection('center_donations')
        .where('buyer_uid', isEqualTo: uid)
        .snapshots()
        .map((s) {
      final list = s.docs.map(CenterDonationOrder.fromDoc).toList();
      list.sort((a, b) {
        final ad = a.createdAt;
        final bd = b.createdAt;
        if (ad == null && bd == null) return 0;
        if (ad == null) return 1;
        if (bd == null) return -1;
        return bd.compareTo(ad);
      });
      return list;
    });
  }

  /// The current user's tree-planting orders (sorted client-side to avoid a
  /// composite index on buyer_uid + created_at).
  Stream<List<CenterTreeOrder>> watchMyTreeOrders(String uid) {
    return _db
        .collection('center_tree_orders')
        .where('buyer_uid', isEqualTo: uid)
        .snapshots()
        .map((s) {
      final list = s.docs.map(CenterTreeOrder.fromDoc).toList();
      list.sort((a, b) {
        final ad = a.createdAt;
        final bd = b.createdAt;
        if (ad == null && bd == null) return 0;
        if (ad == null) return 1;
        if (bd == null) return -1;
        return bd.compareTo(ad);
      });
      return list;
    });
  }

  /// The current user's header stat: name, cumulative donated amount and rank
  /// among all donors. Rank is null when the user hasn't donated yet.
  Future<CenterUserHeaderStat> fetchMyHeaderStat() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return CenterUserHeaderStat.empty;
    final uid = user.uid;

    String name = '';
    try {
      final userDoc = await _db.collection('users').doc(uid).get();
      final ud = userDoc.data() ?? {};
      final first = ((ud['first_name'] as String?) ?? '').trim();
      final last = ((ud['last_name'] as String?) ?? '').trim();
      if (last.isNotEmpty && first.isNotEmpty) {
        name = '${last.substring(0, 1)}.$first';
      } else if (first.isNotEmpty) {
        name = first;
      } else if (last.isNotEmpty) {
        name = last;
      } else {
        // Left untranslated here; the screen applies the localised
        // fallback so it tracks a live language switch.
        name = (ud['name'] as String?) ?? '';
      }
    } catch (_) {}

    final donorRef = _db
        .collection('center_campaign')
        .doc('main')
        .collection('donors')
        .doc(uid);
    final donorSnap = await donorRef.get();
    if (!donorSnap.exists) {
      return CenterUserHeaderStat(name: name, donatedAmount: 0, rank: null);
    }
    final myAmount = (donorSnap.data()?['amount'] as num?)?.toInt() ?? 0;
    final myTreeCount = (donorSnap.data()?['tree_count'] as num?)?.toInt() ?? 0;
    int? rank;
    try {
      final ahead = await _db
          .collection('center_campaign')
          .doc('main')
          .collection('donors')
          .where('amount', isGreaterThan: myAmount)
          .count()
          .get();
      rank = (ahead.count ?? 0) + 1;
    } catch (_) {}
    return CenterUserHeaderStat(
        name: name,
        donatedAmount: myAmount,
        rank: rank,
        treeCount: myTreeCount);
  }

  static const _createTreeOrderUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/createTreeOrder';

  /// Builds a QPay invoice for a tree-planting order (label engraved with
  /// [labelName]). Throws on failure.
  Future<CenterCheckout> createTreeOrder({
    required String treeId,
    required int qty,
    required String labelName,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception(tr('common.sign_in_required'));
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createTreeOrderUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({
        'tree_id': treeId,
        'qty': qty,
        'label_name': labelName,
      }),
    );

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      final rawError = body['error']?.toString();
      throw Exception(rawError != null
          ? trServer(rawError)
          : tr('center.order_create_failed'));
    }

    final invoice =
        MakeOrder.fromJson(body['qpay_invoice'] as Map<String, dynamic>);
    return CenterCheckout(
      pendingId: body['pending_id'] as String,
      amount: (body['amount'] as num).toInt(),
      invoice: invoice,
    );
  }

  /// Builds a QPay invoice for the cart total. Throws on failure.
  Future<CenterCheckout> createDonation({
    required List<Map<String, dynamic>> items,
    required String engraveName,
    required bool anonymous,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception(tr('common.sign_in_required'));
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createDonationUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({
        'items': items,
        'engrave_name': engraveName,
        'anonymous': anonymous,
      }),
    );

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      final rawError = body['error']?.toString();
      throw Exception(rawError != null
          ? trServer(rawError)
          : tr('center.payment_create_failed'));
    }

    final invoice =
        MakeOrder.fromJson(body['qpay_invoice'] as Map<String, dynamic>);
    return CenterCheckout(
      pendingId: body['pending_id'] as String,
      amount: (body['amount'] as num).toInt(),
      invoice: invoice,
    );
  }
}
