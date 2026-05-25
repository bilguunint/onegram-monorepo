import 'package:equatable/equatable.dart';

class DeeplinkModel extends Equatable {
  final String name;
  final String description;
  final String logo;
  final String deeplink;

  const DeeplinkModel(this.name, this.description, this.logo, this.deeplink);

  DeeplinkModel.fromJson(Map<String, dynamic> json)
      : name = json["name"],
        description = json["description"] ?? "",
        logo = json["logo"] ?? "",
        deeplink = json["link"] ?? "";

  @override
  List<Object> get props => [name, description, logo, deeplink];

  static const empty = DeeplinkModel("", "", "", "");
}