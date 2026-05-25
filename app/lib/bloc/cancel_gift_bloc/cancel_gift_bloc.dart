import 'package:flutter_bloc/flutter_bloc.dart';
import '../../repositories/user_repository.dart';
import 'cancel_gift_event.dart';
import 'cancel_gift_state.dart';

class CancelGiftBloc extends Bloc<CancelGiftEvent, CancelGiftState> {
  final UserRepository userRepository;

  CancelGiftBloc({required this.userRepository}) : super(CancelGiftInitial()) {
    on<CancelGiftPressed>(_onCancelGiftPressed);
  }

  Future<void> _onCancelGiftPressed(
    CancelGiftPressed event,
    Emitter<CancelGiftState> emit,
  ) async {
    emit(CancelGiftLoading());

    try {
      print('CancelGiftBloc: Starting gift cancellation for giftId: ${event.giftId}');
      
      final response = await UserRepository.cancelGift(
        giftId: event.giftId,
        token: event.token,
      );

      print('CancelGiftBloc: Gift cancelled successfully - Status: ${response.status}');
      print('CancelGiftBloc: Message: ${response.message}');
      
      emit(CancelGiftSuccess(response: response));
    } catch (e) {
      print('CancelGiftBloc: Error cancelling gift - ${e.toString()}');
      emit(CancelGiftFailure(error: e.toString()));
    }
  }
}
