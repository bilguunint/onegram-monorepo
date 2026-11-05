import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum ProductPurchaseStatus { active, completed, delivered, cancelled }

/// goldInstallment — грамм дээр суурилсан алтан эдлэлийн хуваан төлөлт.
enum PurchaseType { installment, direct, goldInstallment }

class PaymentRecord extends Equatable {
  /// 1-based day index within the installment plan. For [PurchaseType.direct]
  /// purchases this is always 1.
  final int dayNo;
  final int amount;
  final DateTime? paidAt;
  final String? paymentMethod;
  final String? transactionId;

  /// goldInstallment: энэ төлбөрөөр авсан грамм ба тухайн үеийн 1 гр ханш.
  final double? grams;
  final int? rate;

  const PaymentRecord({
    required this.dayNo,
    required this.amount,
    required this.paidAt,
    required this.paymentMethod,
    required this.transactionId,
    this.grams,
    this.rate,
  });

  factory PaymentRecord.fromMap(Map<String, dynamic> map) {
    return PaymentRecord(
      dayNo: ProductPurchase._toInt(map['day_no']),
      amount: ProductPurchase._toInt(map['amount']),
      paidAt: ProductPurchase._toDate(map['paid_at']),
      paymentMethod: map['payment_method'] as String?,
      transactionId: map['transaction_id'] as String?,
      grams: (map['grams'] as num?)?.toDouble(),
      rate: map['rate'] == null ? null : ProductPurchase._toInt(map['rate']),
    );
  }

  @override
  List<Object?> get props =>
      [dayNo, amount, paidAt, paymentMethod, transactionId, grams, rate];
}

class ProductSnapshot extends Equatable {
  final String name;
  final String? image;
  final int price;
  final int cancelFeePercent;

  const ProductSnapshot({
    required this.name,
    required this.image,
    required this.price,
    required this.cancelFeePercent,
  });

  factory ProductSnapshot.fromMap(Map<String, dynamic> map) {
    return ProductSnapshot(
      name: (map['name'] ?? '') as String,
      image: map['image'] as String?,
      price: _toInt(map['price']),
      cancelFeePercent: _toInt(map['cancel_fee_percent']),
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'image': image,
        'price': price,
        'cancel_fee_percent': cancelFeePercent,
      };

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  @override
  List<Object?> get props => [name, image, price, cancelFeePercent];
}

class UserSnapshot extends Equatable {
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? email;

  const UserSnapshot({this.firstName, this.lastName, this.phone, this.email});

  factory UserSnapshot.fromMap(Map<String, dynamic> map) => UserSnapshot(
        firstName: map['first_name'] as String?,
        lastName: map['last_name'] as String?,
        phone: map['phone'] as String?,
        email: map['email'] as String?,
      );

  Map<String, dynamic> toMap() => {
        if (firstName != null) 'first_name': firstName,
        if (lastName != null) 'last_name': lastName,
        if (phone != null) 'phone': phone,
        if (email != null) 'email': email,
      };

  @override
  List<Object?> get props => [firstName, lastName, phone, email];
}

class ProductPurchase extends Equatable {
  final String id;
  final String productId;
  final ProductSnapshot productSnapshot;
  final String userId;
  final UserSnapshot userSnapshot;
  final int totalPrice;

  /// Amount due per day (= ceil(totalPrice / totalDays)). The final day's
  /// QPay invoice may be smaller due to ceiling rounding.
  final int dailyPayment;

  /// User-selected duration in months. Display-only — actual scheduling is
  /// done in days (= months * 30 = [totalDays]).
  final int months;

  /// Total number of daily installments (months * 30).
  final int totalDays;

  final int paidAmount;

  /// Number of daily installments paid so far.
  final int paidDays;

  /// Optional deadline — the date by which all daily payments should be
  /// made. Stored on the doc as `deadline` (set by backend on first
  /// payment to started_at + totalDays days).
  final DateTime? deadline;

  final ProductPurchaseStatus status;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? cancelledAt;
  final String? cancelReason;
  final int? refundAmount;
  final int? refundFee;
  final DateTime? deliveredAt;
  final PurchaseType purchaseType;
  final List<PaymentRecord> payments;
  final String? pickupCode;

  /// "pending" while a user-initiated cancel request awaits admin review.
  final String? cancelRequestStatus;

  /// goldInstallment: эдлэлийн нийт грамм, цугласан грамм, өдөрт төлөхөөр
  /// сонгосон грамм, системийн санал болгосон хоног.
  final double totalGrams;
  final double paidGrams;
  final double dailyGrams;
  final int estimatedDays;

  bool get hasPendingCancelRequest => cancelRequestStatus == 'pending';

  bool get isGold => purchaseType == PurchaseType.goldInstallment;

  /// Ердийн ба алтан эдлэлийн хуваан төлөлт хоёулаа "хуваан төлөлт".
  bool get isAnyInstallment =>
      purchaseType == PurchaseType.installment || isGold;

  double get remainingGrams =>
      ((totalGrams - paidGrams) * 100).round().clamp(0, 1 << 30) / 100;

  const ProductPurchase({
    required this.id,
    required this.productId,
    required this.productSnapshot,
    required this.userId,
    required this.userSnapshot,
    required this.totalPrice,
    required this.dailyPayment,
    required this.months,
    required this.totalDays,
    required this.paidAmount,
    required this.paidDays,
    required this.deadline,
    required this.status,
    required this.startedAt,
    required this.completedAt,
    required this.cancelledAt,
    required this.cancelReason,
    required this.refundAmount,
    required this.refundFee,
    required this.deliveredAt,
    required this.purchaseType,
    required this.payments,
    required this.pickupCode,
    this.cancelRequestStatus,
    this.totalGrams = 0,
    this.paidGrams = 0,
    this.dailyGrams = 0,
    this.estimatedDays = 0,
  });

  factory ProductPurchase.fromMap(String id, Map<String, dynamic> map) {
    final months = _toInt(map['months']);
    final totalDaysRaw = _toInt(map['total_days']);
    return ProductPurchase(
      id: id,
      productId: (map['product_id'] ?? '') as String,
      productSnapshot: ProductSnapshot.fromMap(
          map['product_snapshot'] as Map<String, dynamic>? ?? const {}),
      userId: (map['user_id'] ?? '') as String,
      userSnapshot: UserSnapshot.fromMap(
          map['user_snapshot'] as Map<String, dynamic>? ?? const {}),
      totalPrice: _toInt(map['total_price']),
      dailyPayment: _toInt(map['daily_payment']),
      months: months,
      totalDays: totalDaysRaw > 0 ? totalDaysRaw : months * 30,
      paidAmount: _toInt(map['paid_amount']),
      paidDays: _toInt(map['paid_days']),
      deadline: _toDate(map['deadline']),
      status: _parseStatus(map['status']),
      startedAt: _toDate(map['started_at']),
      completedAt: _toDate(map['completed_at']),
      cancelledAt: _toDate(map['cancelled_at']),
      cancelReason: map['cancel_reason'] as String?,
      refundAmount:
          map['refund_amount'] == null ? null : _toInt(map['refund_amount']),
      refundFee: map['refund_fee'] == null ? null : _toInt(map['refund_fee']),
      deliveredAt: _toDate(map['delivered_at']),
      purchaseType: _parsePurchaseType(map['purchase_type']),
      payments: _parsePayments(map['payments']),
      pickupCode: map['pickup_code'] as String?,
      cancelRequestStatus: map['cancel_request_status'] as String?,
      totalGrams: (map['total_grams'] as num?)?.toDouble() ?? 0,
      paidGrams: (map['paid_grams'] as num?)?.toDouble() ?? 0,
      dailyGrams: (map['daily_grams'] as num?)?.toDouble() ?? 0,
      estimatedDays: _toInt(map['estimated_days']),
    );
  }

  static List<PaymentRecord> _parsePayments(dynamic v) {
    if (v is! List) return const <PaymentRecord>[];
    return v
        .whereType<Map<String, dynamic>>()
        .map(PaymentRecord.fromMap)
        .toList();
  }

  static PurchaseType _parsePurchaseType(dynamic v) {
    if (v == 'direct') return PurchaseType.direct;
    if (v == 'gold_installment') return PurchaseType.goldInstallment;
    return PurchaseType.installment;
  }

  static ProductPurchaseStatus _parseStatus(dynamic v) {
    switch (v) {
      case 'completed':
        return ProductPurchaseStatus.completed;
      case 'delivered':
        return ProductPurchaseStatus.delivered;
      case 'cancelled':
        return ProductPurchaseStatus.cancelled;
      default:
        return ProductPurchaseStatus.active;
    }
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  static DateTime? _toDate(dynamic v) {
    if (v == null) return null;
    if (v is Timestamp) return v.toDate();
    if (v is DateTime) return v;
    if (v is String) return DateTime.tryParse(v);
    return null;
  }

  int get remainingAmount => (totalPrice - paidAmount).clamp(0, totalPrice);

  double get progress {
    if (isGold) {
      return totalGrams <= 0
          ? 0
          : (paidGrams / totalGrams).clamp(0, 1).toDouble();
    }
    return totalPrice <= 0
        ? 0
        : (paidAmount / totalPrice).clamp(0, 1).toDouble();
  }

  /// Days remaining until [deadline], or null when not applicable.
  /// Negative values mean overdue.
  int? get daysUntilDeadline {
    if (deadline == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final due = DateTime(deadline!.year, deadline!.month, deadline!.day);
    return due.difference(today).inDays;
  }

  /// Remaining unpaid daily installments (totalDays - paidDays).
  int get remainingDays => (totalDays - paidDays).clamp(0, totalDays);

  /// Хэрэглэгч нэгэн зэрэг хамгийн ихдээ хэдэн хуваан төлөлт явуулж болох вэ.
  /// Backend-ийн `MAX_ACTIVE_INSTALLMENTS` (createInstallmentInit.js)-тэй нэг
  /// утгатай байх ёстой — апп нь зөвхөн UI-г урьдчилан хаадаг, жинхэнэ
  /// хамгаалалт нь server талд байна.
  static const int maxActiveInstallments = 3;

  /// Өнөөдрийг хүртэл төлсөн байх ЁСТОЙ өдрийн тоо (1-ээс эхэлж [totalDays]-
  /// ээр хязгаарлагдана). [startedAt] мэдэгдэхгүй бол null.
  int? get expectedPaidDays {
    final start = startedAt;
    if (start == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final from = DateTime(start.year, start.month, start.day);
    final elapsed = today.difference(from).inDays;
    final expected = (elapsed < 0 ? 0 : elapsed) + 1;
    return expected > totalDays ? totalDays : expected;
  }

  /// Хуваариасаа хэдэн өдөр хоцорсон. 0 = хоцроогүй эсвэл түрүүлж яваа.
  /// [startedAt] мэдэгдэхгүй бол null.
  int? get daysBehind {
    final expected = expectedPaidDays;
    if (expected == null) return null;
    final behind = expected - paidDays;
    return behind < 0 ? 0 : behind;
  }

  /// Хуваариасаа хэдэн өдөр түрүүлж яваа. 0 = түрүүлээгүй.
  int? get daysAhead {
    final expected = expectedPaidDays;
    if (expected == null) return null;
    final ahead = paidDays - expected;
    return ahead < 0 ? 0 : ahead;
  }

  /// Calendar days since the most recent payment (falling back to
  /// [startedAt] when no payment carries a timestamp). Null when there is no
  /// reference date. Mirrors the admin-side `purchaseDaysSinceLastPayment`.
  ///
  /// Зөвхөн МЭДЭЭЛЛИЙН зорилгоор — хоцорсон эсэхийг шийдэхэд ашиглаж
  /// БОЛОХГҮЙ (урьдчилж төлсөн хэрэглэгчийг буруу тэмдэглэнэ).
  int? get daysSinceLastPayment {
    DateTime? last;
    for (final p in payments) {
      final d = p.paidAt;
      if (d != null && (last == null || d.isAfter(last))) last = d;
    }
    last ??= startedAt;
    if (last == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final ref = DateTime(last.year, last.month, last.day);
    final diff = today.difference(ref).inDays;
    return diff < 0 ? 0 : diff;
  }

  @override
  List<Object?> get props => [
        id,
        productId,
        productSnapshot,
        userId,
        totalPrice,
        dailyPayment,
        months,
        totalDays,
        paidAmount,
        paidDays,
        deadline,
        status,
        cancelRequestStatus,
      ];
}
