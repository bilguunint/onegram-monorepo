import 'package:equatable/equatable.dart';
import '../../models/cancel_gift_model.dart';

abstract class CancelGiftState extends Equatable {
  const CancelGiftState();

  @override
  List<Object?> get props => [];
}

class CancelGiftInitial extends CancelGiftState {}

class CancelGiftLoading extends CancelGiftState {}

class CancelGiftSuccess extends CancelGiftState {
  final CancelGiftResponse response;

  const CancelGiftSuccess({required this.response});

  @override
  List<Object> get props => [response];
}

class CancelGiftFailure extends CancelGiftState {
  final String error;

  const CancelGiftFailure({required this.error});

  @override
  List<Object> get props => [error];
}
