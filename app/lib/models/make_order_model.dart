import 'package:equatable/equatable.dart';
import 'package:onegrgold/models/deeplink.dart';

class MakeOrder extends Equatable {
  final String invoiceId;
  final String qpayShortUrl;
  final String qrImage;
  final String qrText;
  final num quantity;
  final List<DeeplinkModel> links;

  const MakeOrder(this.invoiceId, this.qpayShortUrl, this.qrImage,
      this.qrText, this.quantity, this.links);

  MakeOrder.fromJson(Map<String, dynamic> json)
      : 
        invoiceId = json["invoice_id"] ?? "",
        qpayShortUrl = json["qPay_shortUrl"] ?? "",
        qrImage = json["qr_image"] ?? "",
        qrText = json["qr_text"] ?? "",
        quantity = json["quantity"] ?? 0,
        links = (json["urls"] as List)
            .map((i) => DeeplinkModel.fromJson(i))
            .toList();

  @override
  List<Object> get props =>
      [invoiceId, qpayShortUrl, qrImage, qrText, quantity, links];

  static const empty = MakeOrder("", "", "", "", 0, []);
}