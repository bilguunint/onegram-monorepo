part of 'user_reset_pin_bloc.dart';

@immutable
sealed class UserResetPinEvent extends Equatable {
  const UserResetPinEvent();
}

final class UserResetPinPressed extends UserResetPinEvent {
  const UserResetPinPressed({
    required this.registerNum,
    required this.newPin,
    required this.otpCode,
    required this.input
    
  });

  final String registerNum;
  final String newPin;
  final String otpCode;
  final String input;

  @override
  List<Object> get props => [registerNum, newPin, otpCode];
}
