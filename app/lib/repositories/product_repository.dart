import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:onegrgold/l10n/app_locale.dart';
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
      final list =
          snap.docs.map((d) => ProductPurchase.fromMap(d.id, d.data())).toList()
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
      throw StateError(tr('common.not_signed_in'));
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
      throw StateError(
          tr('common.unexpected_response', {'code': res.statusCode}));
    }

    if (res.statusCode != 200) {
      final rawError = body['error'] as String?;
      final msg = rawError != null
          ? trServer(rawError)
          : tr('purchase.err_installment_init', {'code': res.statusCode});
      throw StateError(msg);
    }

    final invoice = body['qpay_invoice'];
    if (invoice is! Map<String, dynamic>) {
      throw StateError(tr('purchase.err_no_qpay_invoice'));
    }
    final pendingId = body['pending_id'] as String?;
    if (pendingId == null || pendingId.isEmpty) {
      throw StateError(tr('purchase.err_no_pending_id'));
    }
    final amount = (body['amount'] as num?)?.toInt() ??
        (body['daily_payment'] as num?)?.toInt() ??
        0;
    final monthsResp = (body['months'] as num?)?.toInt() ?? months;
    return (
      invoice: MakeOrder.fromJson(invoice),
      pendingId: pendingId,
      amount: amount,
      months: monthsResp,
    );
  }

  /// Ask the backend to create a QPay invoice covering [days] upcoming
  /// installment days (default 1) of the given purchase, starting from the
  /// next unpaid day. Returns the QPay invoice plus the day range
  /// (`dayFrom`…`dayTo`) and total `amount` the backend actually charged.
  ///
  /// The backend determines the starting day from `paid_days + 1`, so callers
  /// only pass [purchaseId] and how many days to bundle.
  Future<({MakeOrder invoice, int dayFrom, int dayTo, int amount})>
      requestInstallmentPayment({
    required String purchaseId,
    int days = 1,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw StateError(tr('common.not_signed_in'));
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_createInstallmentPaymentUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({'purchase_id': purchaseId, 'days': days}),
    );

    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw StateError(
          tr('common.unexpected_response', {'code': res.statusCode}));
    }

    if (res.statusCode != 200) {
      final rawError = body['error'] as String?;
      final msg = rawError != null
          ? trServer(rawError)
          : tr('purchase.err_create_invoice', {'code': res.statusCode});
      throw StateError(msg);
    }

    final invoice = body['qpay_invoice'];
    if (invoice is! Map<String, dynamic>) {
      throw StateError(tr('purchase.err_no_qpay_invoice'));
    }
    final dayFrom = (body['day_from'] as num?)?.toInt() ??
        (body['day_no'] as num?)?.toInt() ??
        0;
    final dayTo = (body['day_to'] as num?)?.toInt() ??
        (body['day_no'] as num?)?.toInt() ??
        dayFrom;
    final amount = (body['amount'] as num?)?.toInt() ?? 0;
    return (
      invoice: MakeOrder.fromJson(invoice),
      dayFrom: dayFrom,
      dayTo: dayTo,
      amount: amount,
    );
  }

  static const String _requestInstallmentCancelUrl =
      'https://asia-northeast1-grammgold.cloudfunctions.net/requestInstallmentCancel';

  /// Submit a cancel request for the user's ACTIVE installment plan. The
  /// backend computes the refund (paid − cancel fee) server-side, creates an
  /// `installment_cancel_requests` doc for admin review and stamps the
  /// purchase with `cancel_request_status: "pending"`. Returns the computed
  /// refund breakdown.
  Future<({int paidAmount, int feePercent, int feeAmount, int refundAmount})>
      requestInstallmentCancel({
    required String purchaseId,
    required String bankName,
    required String accountNumber,
    required String accountHolder,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw StateError(tr('common.not_signed_in'));
    }
    final idToken = await user.getIdToken();

    final res = await http.post(
      Uri.parse(_requestInstallmentCancelUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken',
      },
      body: jsonEncode({
        'purchase_id': purchaseId,
        'bank_name': bankName,
        'account_number': accountNumber,
        'account_holder': accountHolder,
      }),
    );

    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw StateError(
          tr('common.unexpected_response', {'code': res.statusCode}));
    }

    if (res.statusCode != 200) {
      final rawError = body['error'] as String?;
      final msg = rawError != null
          ? trServer(rawError)
          : tr('purchase.err_cancel_request', {'code': res.statusCode});
      throw StateError(msg);
    }

    return (
      paidAmount: (body['paid_amount'] as num?)?.toInt() ?? 0,
      feePercent: (body['fee_percent'] as num?)?.toInt() ?? 0,
      feeAmount: (body['fee_amount'] as num?)?.toInt() ?? 0,
      refundAmount: (body['refund_amount'] as num?)?.toInt() ?? 0,
    );
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
      throw StateError(tr('common.not_signed_in'));
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
      throw StateError(
          tr('common.unexpected_response', {'code': res.statusCode}));
    }

    if (res.statusCode != 200) {
      final rawError = body['error'] as String?;
      final msg = rawError != null
          ? trServer(rawError)
          : tr('purchase.err_create_invoice', {'code': res.statusCode});
      throw StateError(msg);
    }

    final invoice = body['qpay_invoice'];
    if (invoice is! Map<String, dynamic>) {
      throw StateError(tr('purchase.err_no_qpay_invoice'));
    }
    final pendingId = body['pending_id'] as String?;
    if (pendingId == null || pendingId.isEmpty) {
      throw StateError(tr('purchase.err_no_pending_id'));
    }
    return (invoice: MakeOrder.fromJson(invoice), pendingId: pendingId);
  }
}
