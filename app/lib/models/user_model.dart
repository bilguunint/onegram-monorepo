import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/models/balance.dart';

class UserModel {
  final String uid;
  final String firstName;
  final String lastName;
  final String phone;
  final String email;
  final String registrationNumber;
  final int investTotal;
  final Balance balance;
  final DateTime createdAt;

  const UserModel({
    required this.uid,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.email,
    required this.registrationNumber,
    required this.investTotal,
    required this.balance,
    required this.createdAt,
  });

  factory UserModel.fromMap(String uid, Map<String, dynamic> map) {
    return UserModel(
      uid: uid,
      firstName: map['first_name'] ?? '',
      lastName: map['last_name'] ?? '',
      phone: map['phone'] ?? '',
      email: map['email'] ?? '',
      registrationNumber: map['registration_number'] ?? '',
      investTotal: map['invest_total'] ?? 0,
      balance: Balance.fromMap(map['balance'] ?? {}),
      createdAt: (map['created_at'] as Timestamp?)?.toDate() ?? DateTime(2000),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'email': email,
      'registration_number': registrationNumber,
      'invest_total': investTotal,
      'balance': balance.toMap(),
      'created_at': Timestamp.fromDate(createdAt),
    };
  }

  static final empty = UserModel(
    uid: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    registrationNumber: '',
    investTotal: 0,
    balance: const Balance(gold: 0, saving: 0, silver: 0),
    createdAt: DateTime(2000, 1, 1),
  );
}