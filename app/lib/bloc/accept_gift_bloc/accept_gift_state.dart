import 'package:equatable/equatable.dart';
import '../../models/accept_gift_model.dart';

abstract class AcceptGiftState extends Equatable {
  const AcceptGiftState();

  @override
  List<Object?> get props => [];
}

class AcceptGiftInitial extends AcceptGiftState {}

class AcceptGiftLoading extends AcceptGiftState {}

class AcceptGiftSuccess extends AcceptGiftState {
  final AcceptGiftResponse response;

  const AcceptGiftSuccess({required this.response});

  @override
  List<Object> get props => [response];
}

class AcceptGiftFailure extends AcceptGiftState {
  final String error;

  const AcceptGiftFailure({required this.error});

  @override
  List<Object> get props => [error];
}
