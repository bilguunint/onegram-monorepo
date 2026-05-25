class WithdrawResponse {
  final String status;
  final String withdrawId;
  final double quantity;
  final int metalId;
  final double currentBalance;
  final String message;

  WithdrawResponse({
    required this.status,
    required this.withdrawId,
    required this.quantity,
    required this.metalId,
    required this.currentBalance,
    required this.message,
  });

  factory WithdrawResponse.fromJson(Map<String, dynamic> json) {
    return WithdrawResponse(
      status: json['status'] ?? '',
      withdrawId: json['withdraw_id'] ?? '',
      quantity: (json['quantity'] ?? 0).toDouble(),
      metalId: json['metal_id'] ?? 0,
      currentBalance: (json['current_balance'] ?? 0).toDouble(),
      message: json['message'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'withdraw_id': withdrawId,
      'quantity': quantity,
      'metal_id': metalId,
      'current_balance': currentBalance,
      'message': message,
    };
  }

  // Helper getters
  String get metalName => metalId == 1 ? 'Алт' : 'Мөнгө';
  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
}