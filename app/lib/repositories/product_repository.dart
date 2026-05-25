import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/models/product_model.dart';
import 'package:onegrgold/models/product_purchase_model.dart';

class ProductRepository {
  ProductRepository({FirebaseFirestore? db})
      : _db = db ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  CollectionReference<Map<String, dynamic>> get _products =>
      _db.collection('products');

  CollectionReference<Map<String, dynamic>> get _purchases =>
      _db.collection('product_purchases');

  /// Active products visible to users, newest first.
  Stream<List<Product>> watchActiveProducts() {
    return _products
        .where('status', isEqualTo: 'active')
        .orderBy('created_at', descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((d) => Product.fromMap(d.id, d.data())).toList());
  }

  Future<Product?> fetchProduct(String id) async {
    final doc = await _products.doc(id).get();
    if (!doc.exists) return null;
    return Product.fromMap(doc.id, doc.data() ?? const {});
  }

  /// Caller's purchases ordered by start desc.
  Stream<List<ProductPurchase>> watchMyPurchases(String userId) {
    return _purchases
        .where('user_id', isEqualTo: userId)
        .orderBy('started_at', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => ProductPurchase.fromMap(d.id, d.data()))
            .toList());
  }

  /// Stream the caller's currently active installment plan, if any.
  /// Direct purchases (which immediately become "completed") are excluded.
  ///
  /// Returns null when the user has no in-progress installment.
  Stream<ProductPurchase?> watchMyActiveInstallment(String userId) {
    return _purchases
        .where('user_id', isEqualTo: userId)
        .where('status', isEqualTo: 'active')
        .snapshots()
        .map((snap) {
      final list = snap.docs
          .map((d) => ProductPurchase.fromMap(d.id, d.data()))
          .where((p) => p.purchaseType == PurchaseType.installment)
          .toList()
        ..sort((a, b) {
          final ta = a.startedAt?.millisecondsSinceEpoch ?? 0;
          final tb = b.startedAt?.millisecondsSinceEpoch ?? 0;
          return tb.compareTo(ta);
        });
      return list.isEmpty ? null : list.first;
    });
  }

  /// Stream the caller's most-recent fully-paid-but-not-yet-delivered
  /// purchase. Used to show the "ready for pickup" screen with the 6-digit
  /// pickup code + store info.
  Stream<ProductPurchase?> watchMyPickupReadyPurchase(String userId) {
    return _purchases
        .where('user_id', isEqualTo: userId)
        .where('status', isEqualTo: 'completed')
        .snapshots()
        .map((snap) {
      final list = snap.docs
          .map((d) => ProductPurchase.fromMap(d.id, d.data()))
          .toList()
        ..sort((a, b) {
          final ta = a.completedAt?.millisecondsSinceEpoch ?? 0;
          final tb = b.completedAt?.millisecondsSinceEpoch ?? 0;
          return tb.compareTo(ta);
        });
      return list.isEmpty ? null : list.first;
    });
  }

  static const String _createInstallmentPaymentUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/createInstallmentPayment';

  static const String _createInstallmentInitUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/createInstallmentInit';

  /// Start a brand-new installment plan via QPay. The backend does NOT
  /// create the `product_purchases` doc up front — only after the user pays
  /// the first month's invoice does the corresponding callback materialise
  /// the purchase. This stops abandoned "test" plans from polluting the
  /// dataset.
  ///
  /// Returns the QPay invoice for the first month's amount plus the
  /// `pendingId` (the doc the app should subscribe to until the purchase is
  /// created).
  Future<({MakeOrder invoice, String pendingId, int amount, int months})>
      requestInstallmentInit({
    required String productId,
    required int months,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw StateError('Нэвтрээгүй байна.');
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createInstallmentInitUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({'product_id': productId, 'months': months}),
    );

    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw StateError('Сервэрээс хүлээгдэхгүй хариу ирлээ (${res.statusCode}).');
    }

    if (res.statusCode != 200) {
      final msg = (body['error'] as String?) ??
          'Хуваан төлөлт эхлүүлэх амжилтгүй (${res.statusCode}).';
      throw StateError(msg);
    }

    final invoice = body['qpay_invoice'];
    if (invoice is! Map<String, dynamic>) {
      throw StateError('QPay invoice олдсонгүй.');
    }
    final pendingId = body['pending_id'] as String?;
    if (pendingId == null || pendingId.isEmpty) {
      throw StateError('pending_id олдсонгүй.');
    }
    final amount =
        (body['amount'] as num?)?.toInt() ?? (body['daily_payment'] as num?)?.toInt() ?? 0;
    final monthsResp = (body['months'] as num?)?.toInt() ?? months;
    return (
      invoice: MakeOrder.fromJson(invoice),
      pendingId: pendingId,
      amount: amount,
      months: monthsResp,
    );
  }

  /// Ask the backend to create a QPay invoice for the next pending month of
  /// the given purchase. Returns the QPay invoice details for the app to
  /// render (QR code, bank deeplinks).
  ///
  /// The backend determines which month is next from `paid_months + 1`, so
  /// callers only need to pass [purchaseId].
  Future<MakeOrder> requestInstallmentPayment({
    required String purchaseId,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw StateError('Нэвтрээгүй байна.');
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createInstallmentPaymentUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({'purchase_id': purchaseId}),
    );

    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw StateError('Сервэрээс хүлээгдэхгүй хариу ирлээ (${res.statusCode}).');
    }

    if (res.statusCode != 200) {
      final msg = (body['error'] as String?) ??
          'Төлбөрийн нэхэмжлэх үүсгэх амжилтгүй (${res.statusCode}).';
      throw StateError(msg);
    }

    final invoice = body['qpay_invoice'];
    if (invoice is! Map<String, dynamic>) {
      throw StateError('QPay invoice олдсонгүй.');
    }
    return MakeOrder.fromJson(invoice);
  }

  static const String _createDirectPurchaseUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/createDirectPurchase';

  /// Ask the backend to create a QPay invoice for a direct (full-price)
  /// purchase. Returns both the QPay invoice details and the `pendingId`
  /// the caller should subscribe to (in `pending_invoices/{pendingId}`) to
  /// know when the payment has been processed and the `product_purchases`
  /// doc has been created.
  Future<({MakeOrder invoice, String pendingId})> requestDirectPurchasePayment({
    required String productId,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw StateError('Нэвтрээгүй байна.');
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createDirectPurchaseUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({'product_id': productId}),
    );

    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw StateError('Сервэрээс хүлээгдэхгүй хариу ирлээ (${res.statusCode}).');
    }

    if (res.statusCode != 200) {
      final msg = (body['error'] as String?) ??
          'Төлбөрийн нэхэмжлэх үүсгэх амжилтгүй (${res.statusCode}).';
      throw StateError(msg);
    }

    final invoice = body['qpay_invoice'];
    if (invoice is! Map<String, dynamic>) {
      throw StateError('QPay invoice олдсонгүй.');
    }
    final pendingId = body['pending_id'] as String?;
    if (pendingId == null || pendingId.isEmpty) {
      throw StateError('pending_id олдсонгүй.');
    }
    return (invoice: MakeOrder.fromJson(invoice), pendingId: pendingId);
  }
}
