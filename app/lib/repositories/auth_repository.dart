import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:onegrgold/models/login_response.dart';

class AuthRepository {
  final Dio dio;
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  AuthRepository({required this.dio});

  var generateOTPApi = "https://requestotp-yuv3eg5qha-uc.a.run.app";
  var verifyOtpApi = "https://verifyotp-yuv3eg5qha-uc.a.run.app";
  var userResetPinApi = "https://userresetpin-yuv3eg5qha-uc.a.run.app";
  /// Firebase custom token-оор нэвтрэх
  Future<UserCredential> signInWithCustomToken(String token) async {
    return await _firebaseAuth.signInWithCustomToken(token);
  }

  /// Firebase current хэрэглэгч
  User? get currentUser => _firebaseAuth.currentUser;

  /// Firebase UID авах
  String? get currentUid => _firebaseAuth.currentUser?.uid;

  /// Утасны дугаар
  String? get currentPhoneNumber => _firebaseAuth.currentUser?.phoneNumber;

  /// Firebase-с гарах
  Future<void> signOut() async {
    logoutAndClearFCMToken(currentUid!);
    await _firebaseAuth.signOut();
  }

  /// Нэвтэрсэн эсэхийг шалгах
  bool isSignedIn() {
    return _firebaseAuth.currentUser != null;
  }

  Future<int> generateOTP(String input) async {
    try {
      final bool isEmail = _looksLikeEmail(input);
      final Map<String, dynamic> body;
      if (isEmail) {
        body = {"email": input.trim(), "isFourDigits": true}; // хэрэглэгчийн шаардлагын дагуу "email" key
      } else {
        final String normalized = _normalizeMnPhone(input);
        body = {"phoneNumber": normalized, "isFourDigits": true}; // хэрэглэгчийн шаардлагын дагуу "phoneNumber" key
      }
      final Response response = await dio.post(generateOTPApi, data: body);
      return response.statusCode ?? 500; // 200 бол амжилттай
    } on DioException catch (e) {
      return e.response?.statusCode ?? 500; // Алдаа гарсан бол статус код буцаана
    }
  }

  Future<LoginResponse> verifyOTP(String input, String otp) async {
    try {
      final bool isEmail = _looksLikeEmail(input);
      final Map<String, dynamic> body;
      if (isEmail) {
        body = {"email": input.trim(), "otp": otp};
      } else {
        final String normalized = _normalizeMnPhone(input);
        body = {"phoneNumber": normalized, "otp": otp};
      }

      final Response response = await dio.post(verifyOtpApi, data: body);
      return LoginResponse.fromJson(response.data, response.statusCode ?? 500);
    } on DioException catch (e) {
      final res = e.response;
      if (res != null) {
        return LoginResponse.fromJson(res.data, res.statusCode ?? 500);
      }
      return LoginResponse('', false, e.message ?? 'Network error', 500);
    }
  }

  /// PIN шинэчлэх
  Future<Map<String, dynamic>> userResetPin({
    required String registerNum,
    required String newPin,
    required String otpCode,
    required String input
  }) async {
    try {
      final user = _firebaseAuth.currentUser;
      if (user == null) {
        return {"status": "failed", "msg": "Нэвтрээгүй байна"};
      }
      final idToken = await user.getIdToken();
      final String normalizedInput = _looksLikeEmail(input)
          ? input.trim()
          : _normalizeMnPhone(input);
      final response = await dio.post(
        userResetPinApi,
        data: {
          "registerNum": registerNum,
          "newPin": newPin,
          "otpCode": otpCode,
          "input": normalizedInput,
        },
        options: Options(
          headers: {
            "Authorization": "Bearer $idToken",
            "Content-Type": "application/json",
          },
        ),
      );
      if (response.statusCode == 200) {
        return response.data is Map
            ? Map<String, dynamic>.from(response.data)
            : {"status": "success", "msg": "PIN амжилттай шинэчлэгдлээ"};
      }
      return {
        "status": "failed",
        "msg": (response.data is Map ? response.data["msg"] : null) ?? "Алдаа гарлаа",
      };
    } on DioException catch (e) {
      final res = e.response;
      if (res != null) {
        return {
          "status": "failed",
          "msg": (res.data is Map ? res.data["msg"] : null) ?? "Алдаа гарлаа",
        };
      }
      return {"status": "failed", "msg": e.message ?? "Сүлжээний алдаа"};
    }
  }

  /// Dio ашиглан backend-аас custom token авах (optional)
  Future<String> getCustomTokenFromServer(String phone, String otp) async {
    final response = await dio.post('https://yourserver.com/auth/verify', data: {
      'phone': phone,
      'otp': otp,
    });
    return response.data['token']; // should be Firebase custom token
  }

  Future<void> saveTokensToFirestore(String uid) async {
    try {
      final messaging = FirebaseMessaging.instance;
      final fcmToken = await messaging.getToken();
      await messaging.subscribeToTopic("all");
      print(fcmToken);
      if (fcmToken == null) {
        print('⚠️ FCM token is null, skipping token save');
        return;
      }
      final tokenData = {
        'fcm_token': fcmToken,
        'updated_at': FieldValue.serverTimestamp(),
      };
      await FirebaseFirestore.instance.collection('users').doc(uid).update(tokenData);
    } catch (e) {
      print('⚠️ Error saving FCM token: $e');
      // Don't throw, just log the error so login can continue
    }
  }

Future<void> logoutAndClearFCMToken(String uid) async {
  final messaging = FirebaseMessaging.instance;
  await messaging.unsubscribeFromTopic("all");
  await FirebaseFirestore.instance.collection('users').doc(uid).update({
    'fcm_token': FieldValue.delete(),
  });

  await FirebaseAuth.instance.signOut();
}

  bool _looksLikeEmail(String s) {
    final v = s.trim();
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return emailRegex.hasMatch(v);
  }

  String _normalizeMnPhone(String s) {
    final digits = s.replaceAll(RegExp(r'\D'), '');
    // Хэрэв аль хэдийн +976xxxxxxxx хэлбэртэй бол буцаана
    if (s.trim().startsWith('+')) return s.trim();
    if (digits.startsWith('976') && digits.length >= 11) {
      return '+$digits';
    }
    // 8 орон байвал Монголын дугаар гэж үзээд +976 нэмнэ
    if (digits.length == 8) {
      return '+976$digits';
    }
    // 0-оор эхэлвэл 0-г авч хаяад +976 нэмнэ
    if (digits.startsWith('0') && digits.length >= 9) {
      return '+976${digits.substring(1)}';
    }
    // fallback
    return digits.isNotEmpty ? '+$digits' : s.trim();
  }
}