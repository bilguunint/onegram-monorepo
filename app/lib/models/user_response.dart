import 'user.dart';

class UserResponse {
  final User user;
  final bool status;
  final String error;
  final int statusCode;
  final String message;

  UserResponse(
      this.user, this.status, this.error, this.statusCode, this.message);

  UserResponse.fromJson(Map<String, dynamic> json)
      : user = User.fromJson(json["data"]),
        status = json["status"],
        error = "",
        message = json["message"]["mongolian"],
        statusCode = 200;

  UserResponse.withError(String errorValue, String msg)
      : user = User.empty,
        status = false,
        message = msg,
        error = errorValue,
        statusCode = 400;
}
