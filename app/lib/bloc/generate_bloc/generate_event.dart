part of 'generate_bloc.dart';

@immutable
sealed class GenerateEvent extends Equatable {
  const GenerateEvent();
}

final class GeneratePressed extends GenerateEvent {
  const GeneratePressed(this.phone);

  final String phone;

  @override
  List<Object> get props => [phone];
}
