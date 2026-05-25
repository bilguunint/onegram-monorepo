import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum ProductPurchaseStatus { active, completed, delivered, cancelled }

enum PurchaseType { installment, direct }

class PaymentRecord extends Equatable {
  final int monthNo;
  final int amount;
  final DateTime? paidAt;
  final String? paymentMethod;
  final String? transactionId;

  const PaymentRecord({
    required this.monthNo,
    required this.amount,
    required this.paidAt,
    required this.paymentMethod,
    required this.transactionId,
  });

  factory PaymentRecord.fromMap(Map<String, dynamic> map) {
    return PaymentRecord(
      monthNo: ProductPurchase._toInt(map['month_no']),
      amount: ProductPurchase._toInt(map['amount']),
      paidAt: ProductPurchase._toDate(map['paid_at']),
      paymentMethod: map['payment_method'] as String?,
      transactionId: map['transaction_id'] as String?,
    );
  }

  @override
  List<Object?> get props =>
      [monthNo, amount, paidAt, paymentMethod, transactionId];
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
  final int monthlyPayment;
  final int months;
  final int paidAmount;
  final int paidMonths;
  final DateTime? nextDueDate;
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

  const ProductPurchase({
    required this.id,
    required this.productId,
    required this.productSnapshot,
    required this.userId,
    required this.userSnapshot,
    required this.totalPrice,
    required this.monthlyPayment,
    required this.months,
    required this.paidAmount,
    required this.paidMonths,
    required this.nextDueDate,
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
  });

  factory ProductPurchase.fromMap(String id, Map<String, dynamic> map) {
    return ProductPurchase(
      id: id,
      productId: (map['product_id'] ?? '') as String,
      productSnapshot:
          ProductSnapshot.fromMap(map['product_snapshot'] as Map<String, dynamic>? ?? const {}),
      userId: (map['user_id'] ?? '') as String,
      userSnapshot:
          UserSnapshot.fromMap(map['user_snapshot'] as Map<String, dynamic>? ?? const {}),
      totalPrice: _toInt(map['total_price']),
      monthlyPayment: _toInt(map['monthly_payment']),
      months: _toInt(map['months']),
      paidAmount: _toInt(map['paid_amount']),
      paidMonths: _toInt(map['paid_months']),
      nextDueDate: _toDate(map['next_due_date']),
      status: _parseStatus(map['status']),
      startedAt: _toDate(map['started_at']),
      completedAt: _toDate(map['completed_at']),
      cancelledAt: _toDate(map['cancelled_at']),
      cancelReason: map['cancel_reason'] as String?,
      refundAmount: map['refund_amount'] == null ? null : _toInt(map['refund_amount']),
      refundFee: map['refund_fee'] == null ? null : _toInt(map['refund_fee']),
      deliveredAt: _toDate(map['delivered_at']),
      purchaseType: _parsePurchaseType(map['purchase_type']),
      payments: _parsePayments(map['payments']),
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
    return v == 'direct' ? PurchaseType.direct : PurchaseType.installment;
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

  double get progress =>
      totalPrice <= 0 ? 0 : (paidAmount / totalPrice).clamp(0, 1).toDouble();

  @override
  List<Object?> get props => [
        id,
        productId,
        productSnapshot,
        userId,
        totalPrice,
        monthlyPayment,
        months,
        paidAmount,
        paidMonths,
        nextDueDate,
        status,
      ];
}
