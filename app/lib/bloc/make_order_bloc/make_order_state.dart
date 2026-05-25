part of 'make_order_bloc.dart';

@immutable
sealed class MakeOrderState extends Equatable {
  const MakeOrderState();
}

final class MakeOrderStarted extends MakeOrderState {
  @override
  List<Object> get props => [];
}

final class MakeOrderLoading extends MakeOrderState {
  @override
  List<Object> get props => [];
}

final class MakeOrderSuccess extends MakeOrderState {
  const MakeOrderSuccess({required this.makeOrder, required this.order});

  final MakeOrder makeOrder;
  final OrderModel order;
  @override
  List<Object> get props => [makeOrder];
}

final class MakeOrderFailed extends MakeOrderState {
  const MakeOrderFailed({required this.msg});

  final String msg;
  @override
  List<Object> get props => [];
}