import 'package:onegrgold/models/make_order_model.dart';
import 'package:onegrgold/models/order_model.dart';

class MakeOrderResponse {
  final MakeOrder makeOrder;
  final OrderModel order;
  final bool status;
  final String error;
  final String message;

  MakeOrderResponse(
      this.makeOrder, this.order, this.status, this.error, this.message);

  factory MakeOrderResponse.failure(String message) {
    return MakeOrderResponse(
      MakeOrder.empty,
      OrderModel.empty,
      false,
      'error',
      message,
    );
  }

  MakeOrderResponse.fromJson(Map<String, dynamic> json, int code)
      : makeOrder = json['qpay_invoice'] is Map<String, dynamic>
            ? MakeOrder.fromJson(json['qpay_invoice'] as Map<String, dynamic>)
            : MakeOrder.empty,
        order = json['order'] is Map<String, dynamic>
            ? OrderModel.fromJson(json['order'] as Map<String, dynamic>)
            : OrderModel.empty,
        status = code == 200,
        error = json['error']?.toString() ?? '',
        message = json['message']?.toString() ?? '';
}