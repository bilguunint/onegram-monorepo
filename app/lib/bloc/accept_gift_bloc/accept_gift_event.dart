import 'package:equatable/equatable.dart';

abstract class AcceptGiftEvent extends Equatable {
  const AcceptGiftEvent();

  @override
  List<Object> get props => [];
}

class AcceptGiftPressed extends AcceptGiftEvent {
  final String giftId;
  final String token;

  const AcceptGiftPressed({
    required this.giftId,
    required this.token,
  });

  @override
  List<Object> get props => [giftId, token];
}
