// lib/models/cancel_gift_models.dart

class CancelGiftRequest {
  final String giftId;
  final String token;

  CancelGiftRequest({
    required this.giftId,
    required this.token,
  });

  Map<String, dynamic> toJson() => {
        'gift_id': giftId,
        'token': token,
      };
}

class CancelGiftResponse {
  final String status;
  final String giftId;
  final String message;

  CancelGiftResponse({
    required this.status,
    required this.giftId,
    required this.message,
  });

  factory CancelGiftResponse.fromJson(Map<String, dynamic> json) {
    return CancelGiftResponse(
      status: json['status'] ?? '',
      giftId: json['gift_id'] ?? '',
      message: json['message'] ?? '',
    );
  }
}