// lib/models/accept_gift_models.dart

class AcceptGiftRequest {
  final String giftId;
  final String token;

  AcceptGiftRequest({
    required this.giftId,
    required this.token,
  });

  Map<String, dynamic> toJson() => {
        'gift_id': giftId,
        'token': token,
      };
}

class AcceptGiftResponse {
  final String status;
  final String giftId;
  final int quantity;
  final int metalId;
  final String senderName;
  final String? greeting;
  final Balance newBalance;
  final String message;

  AcceptGiftResponse({
    required this.status,
    required this.giftId,
    required this.quantity,
    required this.metalId,
    required this.senderName,
    this.greeting,
    required this.newBalance,
    required this.message,
  });

  factory AcceptGiftResponse.fromJson(Map<String, dynamic> json) {
    return AcceptGiftResponse(
      status: json['status'] ?? '',
      giftId: json['gift_id'] ?? '',
      quantity: json['quantity'] ?? 0,
      metalId: json['metal_id'] ?? 1,
      senderName: json['sender_name'] ?? '',
      greeting: json['greeting'],
      newBalance: Balance.fromJson(json['new_balance'] ?? {}),
      message: json['message'] ?? '',
    );
  }
}

class Balance {
  final double gold;
  final double silver;

  Balance({
    required this.gold,
    required this.silver,
  });

  factory Balance.fromJson(Map<String, dynamic> json) {
    return Balance(
      gold: (json['gold'] ?? 0).toDouble(),
      silver: (json['silver'] ?? 0).toDouble(),
    );
  }
}