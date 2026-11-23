import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';
import 'package:onegrgold/models/login_response.dart';
import 'package:onegrgold/l10n/app_locale.dart';
import '../../repositories/auth_repository.dart';

part 'verify_event.dart';
part 'verify_state.dart';

class VerifyBloc extends Bloc<VerifyEvent, VerifyState> {
  VerifyBloc({required this.authRepository}) : super(VerifyStarted()) {
    on<VerifyPressed>(_onVerifyPressed);
  }

  final AuthRepository authRepository;

  Future<void> _onVerifyPressed(
    VerifyPressed event,
    Emitter<VerifyState> emit,
  ) async {
    emit(VerifyLoading());
    final LoginResponse loginResponse =
        await authRepository.verifyOTP(event.phone, event.otp);
    if (loginResponse.statusCode == 200) {
      emit(VerifySuccess(phone: event.phone, loginResponse: loginResponse));
    } else {
      emit(VerifyFailed(msg: _failureMessage(loginResponse)));
    }
  }

  /// Серверийн хариунаас хэрэглэгчид ойлгомжтой шалтгааныг гаргана.
  /// Өмнө нь бүх тохиолдолд "Баталгаажуулахад алдаа гарлаа!" гэдэг байсан тул
  /// код буруу / хугацаа дууссан / сүлжээ гэдгийг ялгах боломжгүй байв.
  static String _failureMessage(LoginResponse r) {
    final e = r.error;
    if (r.statusCode == 0 || e.startsWith('NETWORK:')) {
      return tr('auth.verify_network');
    }
    if (e.contains('Invalid OTP')) return tr('auth.verify_wrong_code');
    if (e.contains('OTP expired') || e.contains('No OTP request')) {
      return tr('auth.verify_expired');
    }
    return tr('auth.verify_failed');
  }
}
