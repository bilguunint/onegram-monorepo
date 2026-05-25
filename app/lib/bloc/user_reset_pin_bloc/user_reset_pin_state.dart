part of 'user_reset_pin_bloc.dart';

@immutable
sealed class UserResetPinState extends Equatable {
  const UserResetPinState();
}

final class UserResetPinInitial extends UserResetPinState {
  @override
  List<Object> get props => [];
}

final class UserResetPinLoading extends UserResetPinState {
  @override
  List<Object> get props => [];
}

final class UserResetPinSuccess extends UserResetPinState {
  const UserResetPinSuccess({required this.msg});

  final String msg;

  @override
  List<Object> get props => [msg];
}

final class UserResetPinFailure extends UserResetPinState {
  const UserResetPinFailure({required this.msg});

  final String msg;

  @override
  List<Object> get props => [msg];
}
