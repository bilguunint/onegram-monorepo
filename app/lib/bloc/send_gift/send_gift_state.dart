import 'package:equatable/equatable.dart';
import 'package:onegrgold/repositories/user_repository.dart';

abstract class SendGiftState extends Equatable {
  const SendGiftState();
  @override
  List<Object?> get props => [];
}

class SendGiftInitial extends SendGiftState {
  const SendGiftInitial();
}

class SendGiftLoading extends SendGiftState {
  const SendGiftLoading();
}

class SendGiftSuccess extends SendGiftState {
  final CreateGiftResult result;
  const SendGiftSuccess(this.result);
  @override
  List<Object?> get props => [result];
}

class SendGiftFailure extends SendGiftState {
  final String message;
  const SendGiftFailure(this.message);
  @override
  List<Object?> get props => [message];
}
