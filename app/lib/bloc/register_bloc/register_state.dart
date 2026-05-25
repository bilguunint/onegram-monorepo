abstract class RegisterState {}

class RegisterInitial extends RegisterState {}

class RegisterLoading extends RegisterState {}

class RegisterSuccess extends RegisterState {
  final String uid;

  RegisterSuccess(this.uid);
}

class RegisterFailure extends RegisterState {
  final String message;

  RegisterFailure(this.message);
}