import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import 'package:onegrgold/l10n/app_locale.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/models/shuteen_model.dart';

/// Нэгж худалдан авах QPay invoice үүсгэсний үр дүн
class ShuteenCheckout {
  final String pendingId;
  final int amount;
  final int units;
  final MakeOrder invoice;
  const ShuteenCheckout({
    required this.pendingId,
    required this.amount,
    required this.units,
    required this.invoice,
  });
}

/// "Шүтээн хуур" хөтөлбөр: тохиргоо, миний захиалга/гэрчилгээ, нэгж худалдан авалт.
class ShuteenRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  static const _createOrderUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/createShuteenOrder';
  static const callbackUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/shuteenOrderCallback';
  static const _verifyUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/verifyShuteenCertificate';

  Stream<ShuteenProgramInfo> watchProgram() {
    return _db
        .collection('shuteen_khuur')
        .doc('main')
        .snapshots()
        .map((s) => ShuteenProgramInfo.fromMap(s.data()));
  }

  /// Хэрэглэгчийн нэгтгэл — нэгж, дүн, түвшин
  Stream<ShuteenHolding> watchMyHolding(String uid) {
    return _db
        .collection('shuteen_holders')
        .doc(uid)
        .snapshots()
        .map((s) => ShuteenHolding.fromMap(s.data()));
  }

  /// Хэрэглэгчийн гэрчилгээнүүд, шинэ нь эхэнд
  Stream<List<ShuteenOrder>> watchMyOrders(String uid) {
    return _db
        .collection('shuteen_orders')
        .where('buyer_uid', isEqualTo: uid)
        .snapshots()
        .map((s) {
      final list =
          s.docs.map((d) => ShuteenOrder.fromDoc(d.id, d.data())).toList();
      list.sort((a, b) {
        final ad = a.createdAt, bd = b.createdAt;
        if (ad == null || bd == null) return 0;
        return bd.compareTo(ad);
      });
      return list;
    });
  }

  /// Нэг гэрчилгээ (QR шалгах, дэлгэрэнгүй)
  Stream<ShuteenOrder?> watchOrder(String id) {
    return _db.collection('shuteen_orders').doc(id).snapshots().map((s) {
      final d = s.data();
      return d == null ? null : ShuteenOrder.fromDoc(s.id, d);
    });
  }

  /// [units] нэгжийн QPay invoice үүсгэнэ. Алдаа бол throw.
  Future<ShuteenCheckout> createOrder({required int units}) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception(tr('common.sign_in_required'));
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createOrderUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({'units': units}),
    );

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      final rawError = body['error']?.toString();
      throw Exception(rawError != null
          ? trServer(rawError)
          : tr('shuteen.order_create_failed'));
    }

    final invoice =
        MakeOrder.fromJson(body['qpay_invoice'] as Map<String, dynamic>);
    return ShuteenCheckout(
      pendingId: body['pending_id'] as String,
      amount: (body['amount'] as num).toInt(),
      units: (body['units'] as num).toInt(),
      invoice: invoice,
    );
  }

  /// QR-ийн утгыг серверээр шалгана (нэвтрэлт шаардахгүй). Сүлжээний алдаанд throw.
  Future<ShuteenVerifyResult> verifyCertificate(String payload) async {
    final res = await http
        .post(
          Uri.parse(_verifyUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'payload': payload}),
        )
        .timeout(const Duration(seconds: 20));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return ShuteenVerifyResult.fromJson(body);
  }
}
