import 'package:equatable/equatable.dart';

class OrderModel extends Equatable {
  final String id;
  final String userId;
  final int metalId;
  final num amount;
  final num price;
  final num quantity;
  final String paymentStatus;
  final String adminStatus;
  final String prodType;
  final String createdAt;
  final String qpayDescription;
  // New: nested client info from response
  final Client? client;

  const OrderModel(
    this.id,
    this.userId,
    this.metalId,
    this.amount,
    this.price,
    this.quantity,
    this.paymentStatus,
    this.adminStatus,
    this.prodType,
    this.createdAt,
    this.qpayDescription, {
    this.client,
  });

  OrderModel.fromJson(Map<String, dynamic> json)
      : id = json["id"]?.toString() ?? "",
        userId = json["user_id"]?.toString() ?? "",
        metalId = _toInt(json["metal_id"]),
        amount = _toNum(json["amount"]),
        price = _toNum(json["price"]),
        quantity = _toNum(json["quantity"]),
        paymentStatus = json["payment_status"]?.toString() ?? json["status"]?.toString() ?? "",
        adminStatus = json["admin_status"]?.toString() ?? "",
        prodType = json["prod_type"]?.toString() ?? json["type"]?.toString() ?? "",
        createdAt = json["created_at"]?.toString() ?? "",
        qpayDescription = json["qpay_description"]?.toString() ?? "",
        client = json['client'] is Map<String, dynamic>
            ? Client.fromJson(json['client'] as Map<String, dynamic>)
            : null;

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  static num _toNum(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v;
    if (v is String) return num.tryParse(v) ?? 0;
    return 0;
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        metalId,
        amount,
        price,
        quantity,
        paymentStatus,
        adminStatus,
        prodType,
        createdAt,
        qpayDescription,
        client,
      ];

  static const empty = OrderModel("", "", 0, 0, 0, 0, "", "", "", "", "");
}

class Client extends Equatable {
  final String phone;
  final String? email;
  final String firstName;
  final String lastName;

  const Client({
    required this.phone,
    this.email,
    required this.firstName,
    required this.lastName,
  });

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        phone: json['phone']?.toString() ?? '',
        email: json['email'] == null ? null : json['email']?.toString(),
        firstName: json['first_name']?.toString() ?? '',
        lastName: json['last_name']?.toString() ?? '',
      );

  static const empty = Client(
    phone: '',
    email: null,
    firstName: '',
    lastName: '',
  );

  @override
  List<Object?> get props => [phone, email, firstName, lastName];
}