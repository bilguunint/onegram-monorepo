import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';
import '../../repositories/auth_repository.dart';

part 'user_reset_pin_event.dart';
part 'user_reset_pin_state.dart';

class UserResetPinBloc extends Bloc<UserResetPinEvent, UserResetPinState> {
  UserResetPinBloc({required this.authRepository}) : super(UserResetPinInitial()) {
    on<UserResetPinPressed>(_onUserResetPinPressed);
  }

  final AuthRepository authRepository;

  Future<void> _onUserResetPinPressed(
    UserResetPinPressed event,
    Emitter<UserResetPinState> emit,
  ) async {
    emit(UserResetPinLoading());
    final result = await authRepository.userResetPin(
      registerNum: event.registerNum,
      newPin: event.newPin,
      otpCode: event.otpCode,
      input: event.input
    );
    if (result['status'] == 'success') {
      emit(UserResetPinSuccess(msg: result['msg'] ?? 'PIN амжилттай шинэчлэгдлээ'));
    } else {
      emit(UserResetPinFailure(msg: result['msg'] ?? 'Алдаа гарлаа'));
    }
  }
}
