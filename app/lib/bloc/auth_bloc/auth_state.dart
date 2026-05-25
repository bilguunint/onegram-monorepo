part of 'auth_bloc.dart';

@immutable
sealed class AuthState extends Equatable {
  const AuthState();
}

final class AuthInitial extends AuthState {
  @override
  List<Object?> get props => [];
}

final class AuthLoading extends AuthState {
  @override
  List<Object?> get props => [];
}

final class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.uid);

  final String uid;

  @override
  List<Object?> get props => [uid];
}

final class AuthUnauthenticated extends AuthState {
  @override
  List<Object?> get props => [];
}

final class AuthNeedsRegistration extends AuthState {
  const AuthNeedsRegistration(this.phoneNumber, this.uid);

  final String phoneNumber;
  final String uid;

  @override
  List<Object?> get props => [phoneNumber, uid];
}

final class AuthFailure extends AuthState {
  const AuthFailure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}
