part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent extends Equatable {
  const AuthEvent();
}

final class AppStarted extends AuthEvent {
  @override
  List<Object?> get props => [];
}

final class LoggedIn extends AuthEvent {
  const LoggedIn(this.loginResponse);

  final LoginResponse loginResponse;

  @override
  List<Object?> get props => [loginResponse];
}

final class LoggedOut extends AuthEvent {
  @override
  List<Object?> get props => [];
}

final class RegisterRequested extends AuthEvent {
  @override
  List<Object?> get props => [];
}
