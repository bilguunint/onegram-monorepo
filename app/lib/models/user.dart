import 'package:equatable/equatable.dart';

class User extends Equatable {
  final int id;
  final String firstName;
  final String lastName;
  final String bankName;
  final String bankAccount;
  final String phone;
  final int isActive;
  final int isRegistered;
  final int isVip;

  const User(
      this.id,
      this.firstName,
      this.lastName,
      this.bankName,
      this.bankAccount,
      this.phone,
      this.isActive,
      this.isRegistered,
      this.isVip);

  User.fromJson(Map<String, dynamic> json)
      : id = json["id"],
        firstName = json["first_name"] ?? "",
        lastName = json["last_name"] ?? "",
        bankName = json["bank_name"] ?? "",
        bankAccount = json["bank_account"] ?? "",
        phone = json["phone"] ?? "",
        isActive = json["is_active"] ?? "",
        isRegistered = json["is_registered"] ?? "",
        isVip = json["is_vip"] ?? 0;

  @override
  List<Object> get props =>
      [id, firstName, lastName, phone, isActive, isRegistered, isVip];

  static const empty = User(0, "", "", "", "", "", 0, 0, 0);
}
