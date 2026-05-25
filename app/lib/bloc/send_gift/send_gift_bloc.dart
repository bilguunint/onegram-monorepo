import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:onegrgold/repositories/user_repository.dart';
import 'send_gift_event.dart';
import 'send_gift_state.dart';

class SendGiftBloc extends Bloc<SendGiftEvent, SendGiftState> {
  final UserRepository userRepository;
  SendGiftBloc({required this.userRepository}) : super(const SendGiftInitial()) {
    on<SendGiftSubmitted>(_onSendGiftSubmitted);
    on<SendGiftReset>((event, emit) => emit(const SendGiftInitial()));
  }

  Future<void> _onSendGiftSubmitted(
    SendGiftSubmitted event,
    Emitter<SendGiftState> emit,
  ) async {
    print('SendGiftBloc: Starting gift submission...'); // Debug
    emit(const SendGiftLoading());
    print('SendGiftBloc: Emitted loading state'); // Debug
    
    try {
      print('SendGiftBloc: Calling userRepository.sendGift'); // Debug
      final result = await userRepository.sendGift(
        receiverPhone: event.receiverPhone,
        quantity: event.quantity,
        metalId: event.metalId,
        pincode: event.pincode,
        greeting: event.greeting,
        useEmulator: event.useEmulator,
      );
      print('SendGiftBloc: Gift sent successfully: ${result.giftId}'); // Debug
      emit(SendGiftSuccess(result));
    } on GiftException catch (e) {
      print('SendGiftBloc: GiftException caught: ${e.message}'); // Debug
      emit(SendGiftFailure(e.message));
    } catch (e) {
      print('SendGiftBloc: General exception caught: $e'); // Debug
      emit(SendGiftFailure('Алдаа гарлаа: ${e.toString()}'));
    }
  }
}
