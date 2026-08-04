import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import '../../repositories/auth_repository.dart';

part 'generate_event.dart';
part 'generate_state.dart';

class GenerateBloc extends Bloc<GenerateEvent, GenerateState> {
  GenerateBloc({required this.authRepository}) : super(GenerateStarted()) {
    on<GeneratePressed>(_onPhonePressed);
  }

  final AuthRepository authRepository;

  Future<void> _onPhonePressed(
    GeneratePressed event,
    Emitter<GenerateState> emit,
  ) async {
    emit(GenerateLoading());
    final int statusCode =
        await authRepository.generateOTP(event.phone);
    if (statusCode == 200) {
      emit(GenerateSuccess(phone: event.phone));
    } else {
      emit(GenerateFailed(
          msg: tr('auth.otp_send_failed_code', {'code': statusCode})));
    }
  }
}
