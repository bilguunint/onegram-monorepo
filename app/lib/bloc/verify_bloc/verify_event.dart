part of 'verify_bloc.dart';

@immutable
sealed class VerifyEvent extends Equatable {
  const VerifyEvent();
}

final class VerifyPressed extends VerifyEvent {
  const VerifyPressed(this.phone, this.otp);

  final String phone;
  final String otp;

  @override
  List<Object> get props => [phone];
}
