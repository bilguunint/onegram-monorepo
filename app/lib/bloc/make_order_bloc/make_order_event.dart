part of 'make_order_bloc.dart';

@immutable
sealed class MakeOrderEvent extends Equatable {
  const MakeOrderEvent();
}

final class MakeOrderPressed extends MakeOrderEvent {
  const MakeOrderPressed(
      this.userId, this.quantity, this.metalId, this.prodType, this.price);

  final String userId;
  final num quantity;
  final int metalId;
  final String prodType;
  final num price;

  @override
  List<Object> get props => [userId, quantity, metalId];
}