class LoginResponse {
  final String token;
  final bool isUserExist;
  final String error;
  final int statusCode;

  LoginResponse(this.token, this.isUserExist, this.error, this.statusCode);

  /// Сервер амжилттай үед JSON ({token}), алдаатай үед энгийн текст
  /// ("Invalid OTP", "OTP expired" ...) буцаадаг тул хоёуланг нь хүлээн авна.
  factory LoginResponse.fromJson(dynamic json, int code) {
    if (json is Map) {
      return LoginResponse(
        (json["token"] ?? "").toString(),
        json["isUserExist"] == true,
        (json["error"] ?? "").toString(),
        code,
      );
    }
    return LoginResponse("", false, json?.toString() ?? "", code);
  }
}
