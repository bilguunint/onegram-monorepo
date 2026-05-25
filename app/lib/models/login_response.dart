class LoginResponse {
  final String token;
  final bool isUserExist;
  final String error;
  final int statusCode;

  LoginResponse(this.token, this.isUserExist, this.error, this.statusCode);

  LoginResponse.fromJson(Map<String, dynamic> json, int code)
      : token = json["token"],
        isUserExist = json["isUserExist"] ?? false,
        error = "",
        statusCode = code;
}