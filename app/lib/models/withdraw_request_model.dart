class WithdrawRequest {
  final String userId;
  final double quantity;
  final int metalId;
  final String pincode;
  final String token;

  WithdrawRequest({
    required this.userId,
    required this.quantity,
    required this.metalId,
    required this.pincode,
    required this.token,
  });

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'quantity': quantity,
      'metal_id': metalId,
      'pincode': pincode,
      'token': token,
    };
  }
}