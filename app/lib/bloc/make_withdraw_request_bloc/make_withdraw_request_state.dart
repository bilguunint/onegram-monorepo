import 'package:onegrgold/models/withdraw_request_response.dart';

abstract class MakeWithdrawRequestState {}

class MakeWithdrawRequestInitial extends MakeWithdrawRequestState {}

class MakeWithdrawRequestLoading extends MakeWithdrawRequestState {}

class MakeWithdrawRequestSuccess extends MakeWithdrawRequestState {
  final WithdrawResponse response;

  MakeWithdrawRequestSuccess({required this.response});
}

class MakeWithdrawRequestFailure extends MakeWithdrawRequestState {
  final String message;

  MakeWithdrawRequestFailure({required this.message});
}
