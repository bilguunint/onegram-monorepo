abstract class RegisterEvent {}

class RegisterSubmitted extends RegisterEvent {
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String email;
  final String registrationNumber;

  RegisterSubmitted({
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.email,
    required this.registrationNumber,
  });
}