import 'package:cloud_firestore/cloud_firestore.dart';

class UserInfo {
  final String uid;
  final String? email;
  final String firstName;
  final String lastName;
  final String phone;

  const UserInfo({
    required this.uid,
    this.email,
    required this.firstName,
    required this.lastName,
    required this.phone,
  });

  factory UserInfo.fromMap(Map<String, dynamic> map) {
    return UserInfo(
      uid: map['uid'] ?? '',
      email: map['email'],
      firstName: map['first_name'] ?? '',
      lastName: map['last_name'] ?? '',
      phone: map['phone'] ?? '',
    );
  }

  String get fullName => '$firstName $lastName';

  static final UserInfo empty = UserInfo(
    uid: '',
    firstName: '',
    lastName: '',
    phone: '',
  );
}

class GiftOrder {
  final String id;
  final String giftId;
  final UserInfo sender;
  final UserInfo receiver;
  final num quantity;
  final int metalId;
  final String? greeting;
  final DateTime createdAt;
  final String status;
  final num? amount;

  const GiftOrder({
    required this.id,
    required this.giftId,
    required this.sender,
    required this.receiver,
    required this.quantity,
    required this.metalId,
    this.greeting,
    required this.createdAt,
    required this.status,
    this.amount,
  });

  factory GiftOrder.fromMap(String id, Map<String, dynamic> map) {
    return GiftOrder(
      id: id,
      giftId: map['id'] ?? '',
      sender: UserInfo.fromMap(map['sender'] ?? {}),
      receiver: UserInfo.fromMap(map['receiver'] ?? {}),
      quantity: map['quantity'] ?? 0,
      metalId: map['metal_id'] ?? 1,
      greeting: map['greeting'],
      createdAt: (map['created_at'] as Timestamp?)?.toDate() ?? DateTime.now(),
      status: map['status'] ?? 'pending',
      amount: map['amount'],
    );
  }

  static final GiftOrder empty = GiftOrder(
    id: '',
    giftId: '',
    sender: UserInfo.empty,
    receiver: UserInfo.empty,
    quantity: 0,
    metalId: 1,
    createdAt: DateTime(2000),
    status: '',
  );
}