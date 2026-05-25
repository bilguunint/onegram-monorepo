import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/models/login_response.dart';
import 'package:onegrgold/repositories/auth_repository.dart';
import 'package:onegrgold/repositories/user_repository.dart';
part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;
  final UserRepository userRepository;

  AuthBloc(this.authRepository, this.userRepository) : super(AuthInitial()) {
    on<AppStarted>(_onAppStarted);
    on<LoggedIn>(_onLoggedIn);
    on<LoggedOut>(_onLoggedOut);
    on<RegisterRequested>(_onRegisterRequested);
  }

  Future<void> _onAppStarted(AppStarted event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    final user = authRepository.currentUser;
    print("App is Starting");
    if (user != null) {
      final isRegistered = await userRepository.userExists(user.uid);
      if (isRegistered) {
        print("FCM Token is saving");
        await authRepository.saveTokensToFirestore(user.uid);
        emit(AuthAuthenticated(user.uid));
      } else {
        emit(AuthNeedsRegistration(user.phoneNumber ?? '', user.uid));
      }
    } else {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLoggedIn(LoggedIn event, Emitter<AuthState> emit) async {
    print('AuthBloc: Processing LoggedIn event');
    emit(AuthLoading());
    try {
      final userCredential =
          await authRepository.signInWithCustomToken(event.loginResponse.token);
      final uid = userCredential.user?.uid;
      print('AuthBloc: User credential obtained, uid: $uid');
      if (uid != null) {
        final isRegistered = await userRepository.userExists(uid);
        print('AuthBloc: User exists check: $isRegistered');
        if (isRegistered) {
          await authRepository.saveTokensToFirestore(uid);
          print('AuthBloc: Emitting AuthAuthenticated with uid: $uid');
          emit(AuthAuthenticated(uid));
          print('AuthBloc: AuthAuthenticated state emitted successfully');
        } else {
          print('AuthBloc: User needs registration');
          emit(AuthNeedsRegistration(
              userCredential.user?.phoneNumber ?? 'unknown', uid));
        }
      } else {
        print('AuthBloc: No uid found, emitting unauthenticated');
        emit(AuthUnauthenticated());
      }
    } catch (e) {
      print('AuthBloc: Login failed with error: $e');
      emit(AuthFailure("Login failed: ${e.toString()}"));
    }
  }

  Future<void> _onLoggedOut(LoggedOut event, Emitter<AuthState> emit) async {
    await authRepository.signOut();
    emit(AuthUnauthenticated());
  }

  Future<void> _onRegisterRequested(
      RegisterRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    final user = authRepository.currentUser;
    if (user != null) {
      final isRegistered = await userRepository.userExists(user.uid);
      if (isRegistered) {
        emit(AuthAuthenticated(user.uid));
      } else {
        emit(AuthNeedsRegistration(user.phoneNumber ?? '', user.uid));
      }
    } else {
      emit(AuthUnauthenticated());
    }
  }
  
}
