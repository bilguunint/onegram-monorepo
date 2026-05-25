// 📦 BLoC файл: register_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/models/balance.dart';
import '../../repositories/user_repository.dart';
import '../../repositories/auth_repository.dart';
import '../../models/user_model.dart';
import 'register_event.dart';
import 'register_state.dart';

class RegisterBloc extends Bloc<RegisterEvent, RegisterState> {
  final UserRepository userRepository;
  final AuthRepository authRepository;

  RegisterBloc({required this.userRepository, required this.authRepository})
      : super(RegisterInitial()) {
    on<RegisterSubmitted>(_onRegisterSubmitted);
  }

  Future<void> _onRegisterSubmitted(
    RegisterSubmitted event,
    Emitter<RegisterState> emit,
  ) async {
    emit(RegisterLoading());
    try {
      final uid = authRepository.currentUid;
      if (uid == null) {
        emit(RegisterFailure("User UID not found."));
        return;
      }
      final user = UserModel(
        uid: uid,
        firstName: event.firstName,
        lastName: event.lastName,
        phone: event.phoneNumber,
        email: event.email,
        registrationNumber: event.registrationNumber,
        balance: const Balance(
          gold: 0,
          silver: 0,
          saving: 0
        ),
        investTotal: 0,
        createdAt: DateTime.now(),
      );
      await userRepository.createUser(user: user);
      emit(RegisterSuccess(uid));
    } catch (e) {
      emit(RegisterFailure("Registration error: ${e.toString()}"));
    }
  }
}
