import 'package:equatable/equatable.dart';

abstract class SendGiftEvent extends Equatable {
  const SendGiftEvent();
  @override
  List<Object?> get props => [];
}

class SendGiftSubmitted extends SendGiftEvent {
  final String receiverPhone;
  final num quantity;
  final int metalId; // 1=gold, 3=silver
  final String pincode;
  final String? greeting;
  final bool useEmulator;

  const SendGiftSubmitted({
    required this.receiverPhone,
    required this.quantity,
    required this.metalId,
    required this.pincode,
    this.greeting,
    this.useEmulator = false,
  });

  @override
  List<Object?> get props => [receiverPhone, quantity, metalId, pincode, greeting, useEmulator];
}

class SendGiftReset extends SendGiftEvent {
  const SendGiftReset();
}
