part of 'verify_bloc.dart';

@immutable
sealed class VerifyState extends Equatable {
  const VerifyState();
}

final class VerifyStarted extends VerifyState {
  @override
  List<Object> get props => [];
}

final class VerifyLoading extends VerifyState {
  @override
  List<Object> get props => [];
}

final class VerifySuccess extends VerifyState {
  const VerifySuccess({required this.phone, required this.loginResponse});

  final String phone;
  final LoginResponse loginResponse;
  @override
  List<Object> get props => [phone];
}

final class VerifyFailed extends VerifyState {
  const VerifyFailed({required this.msg});

  final String msg;
  @override
  List<Object> get props => [];
}
