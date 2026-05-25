import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_event.dart';
import 'package:onegrgold/bloc/make_withdraw_request_bloc/make_withdraw_request_state.dart';
import 'package:onegrgold/repositories/user_repository.dart';

class MakeWithdrawRequestBloc extends Bloc<MakeWithdrawRequestEvent, MakeWithdrawRequestState> {
  MakeWithdrawRequestBloc() : super(MakeWithdrawRequestInitial()) {
    on<MakeWithdrawRequestSubmitted>(_onMakeWithdrawRequestSubmitted);
  }

  Future<void> _onMakeWithdrawRequestSubmitted(
    MakeWithdrawRequestSubmitted event,
    Emitter<MakeWithdrawRequestState> emit,
  ) async {
    try {
      print('MakeWithdrawRequestBloc: Starting withdraw request with quantity=${event.quantity}, metalId=${event.metalId}'); // Debug
      
      emit(MakeWithdrawRequestLoading());

      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('MakeWithdrawRequestBloc: User not authenticated'); // Debug
        emit(MakeWithdrawRequestFailure(message: 'Нэвтэрч орно уу'));
        return;
      }

      final token = await user.getIdToken();
      print('MakeWithdrawRequestBloc: Got Firebase token'); // Debug

      final response = await UserRepository.createWithdrawRequest(
        userId: user.uid,
        quantity: event.quantity,
        metalId: event.metalId,
        pincode: event.pincode,
        token: token ?? '',
      );

      print('MakeWithdrawRequestBloc: Got response - status: ${response.status}, withdrawId: ${response.withdrawId}'); // Debug

      emit(MakeWithdrawRequestSuccess(response: response));
    } catch (e) {
      print('MakeWithdrawRequestBloc: Error - ${e.toString()}'); // Debug
      emit(MakeWithdrawRequestFailure(message: e.toString()));
    }
  }
}
