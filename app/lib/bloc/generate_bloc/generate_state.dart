part of 'generate_bloc.dart';

@immutable
sealed class GenerateState extends Equatable {
  const GenerateState();
}

final class GenerateStarted extends GenerateState {
  @override
  List<Object> get props => [];
}

final class GenerateLoading extends GenerateState {
  @override
  List<Object> get props => [];
}

final class GenerateSuccess extends GenerateState {
  const GenerateSuccess({required this.phone});

  final String phone;
  @override
  List<Object> get props => [phone];
}

final class GenerateFailed extends GenerateState {
  const GenerateFailed({required this.msg});

  final String msg;
  @override
  List<Object> get props => [];
}
