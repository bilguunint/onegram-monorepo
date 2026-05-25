import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';
import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/models/make_order_response.dart';
import 'package:onegrgold/models/order_model.dart';
import 'package:onegrgold/repositories/user_repository.dart';
part 'make_order_event.dart';
part 'make_order_state.dart';

class MakeOrderBloc extends Bloc<MakeOrderEvent, MakeOrderState> {
  MakeOrderBloc({required this.userRepository}) : super(MakeOrderStarted()) {
    on<MakeOrderPressed>(_onOrderPressed);
  }

  final UserRepository userRepository;

  Future<void> _onOrderPressed(
    MakeOrderPressed event,
    Emitter<MakeOrderState> emit,
  ) async {
    emit(MakeOrderLoading());
    final MakeOrderResponse makeOrderResponse = await userRepository.makeOrder(
        event.userId, event.metalId, event.quantity, event.prodType, event.price);
    print(makeOrderResponse.makeOrder);
    if (makeOrderResponse.status) {
      emit(MakeOrderSuccess(makeOrder: makeOrderResponse.makeOrder, order: makeOrderResponse.order));
    } else {
      emit(MakeOrderFailed(msg: makeOrderResponse.message));
    }
  }
}