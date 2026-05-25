import 'package:equatable/equatable.dart';

abstract class CancelGiftEvent extends Equatable {
  const CancelGiftEvent();

  @override
  List<Object> get props => [];
}

class CancelGiftPressed extends CancelGiftEvent {
  final String giftId;
  final String token;

  const CancelGiftPressed({
    required this.giftId,
    required this.token,
  });

  @override
  List<Object> get props => [giftId, token];
}
