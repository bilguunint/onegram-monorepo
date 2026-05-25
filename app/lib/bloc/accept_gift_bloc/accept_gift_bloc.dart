import 'package:flutter_bloc/flutter_bloc.dart';
import '../../repositories/user_repository.dart';
import 'accept_gift_event.dart';
import 'accept_gift_state.dart';

class AcceptGiftBloc extends Bloc<AcceptGiftEvent, AcceptGiftState> {
  final UserRepository userRepository;

  AcceptGiftBloc({required this.userRepository}) : super(AcceptGiftInitial()) {
    on<AcceptGiftPressed>(_onAcceptGiftPressed);
  }

  Future<void> _onAcceptGiftPressed(
    AcceptGiftPressed event,
    Emitter<AcceptGiftState> emit,
  ) async {
    emit(AcceptGiftLoading());

    try {
      print('AcceptGiftBloc: Starting gift acceptance for giftId: ${event.giftId}');
      
      final response = await UserRepository.acceptGift(
        giftId: event.giftId,
        token: event.token,
      );

      print('AcceptGiftBloc: Gift accepted successfully - Status: ${response.status}');
      print('AcceptGiftBloc: New balance - Gold: ${response.newBalance.gold}, Silver: ${response.newBalance.silver}');
      
      emit(AcceptGiftSuccess(response: response));
    } catch (e) {
      print('AcceptGiftBloc: Error accepting gift - ${e.toString()}');
      emit(AcceptGiftFailure(error: e.toString()));
    }
  }
}
