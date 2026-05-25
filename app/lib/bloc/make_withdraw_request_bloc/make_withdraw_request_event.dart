abstract class MakeWithdrawRequestEvent {}

class MakeWithdrawRequestSubmitted extends MakeWithdrawRequestEvent {
  final double quantity;
  final int metalId;
  final String pincode;

  MakeWithdrawRequestSubmitted({
    required this.quantity,
    required this.metalId,
    required this.pincode,
  });
}
