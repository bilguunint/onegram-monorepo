import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:onegrgold/models/accept_gift_model.dart';
import 'package:onegrgold/models/cancel_gift_model.dart';
import 'package:onegrgold/models/make_order_response.dart';
import 'package:onegrgold/models/user_model.dart';
import 'package:http/http.dart' as http;
import 'package:onegrgold/models/withdraw_request_model.dart';
import 'dart:convert';

import 'package:onegrgold/models/withdraw_request_response.dart';

class UserRepository {
  final Dio _dio = Dio();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore firestore;
  UserRepository({FirebaseFirestore? firestoreInstance})
      : firestore = firestoreInstance ?? FirebaseFirestore.instance;

  var orderApi = "https://createorder-yuv3eg5qha-an.a.run.app/";

  Future<bool> userExists(String uid) async {
    try {
      final doc = await firestore.collection('users').doc(uid).get();
      return doc.exists;
    } catch (e) {
      print('🔥 userExists error: $e');
      return false;
    }
  }

  Future<void> createUser({
    required UserModel user,
  }) async {
    try {
      await firestore.collection('users').doc(user.uid).set(user.toMap());
    } catch (e) {
      print('🔥 createUser error: $e');
      rethrow;
    }
  }

  Future<bool> isPincodeSet(String uid) async {
    try {
      final doc = await firestore.collection('users').doc(uid).get();
      return doc.exists && (doc.data()?['pinHash'] != null);
    } catch (e) {
      debugPrint('🔥 isPincodeSet error: $e');
      return false;
    }
  }

  Future<void> setPincode(String pin) async {
    try {
      final token = await _auth.currentUser?.getIdToken();
      if (token == null) throw Exception('Authentication token missing');

      final response = await _dio.post(
        'https://setpin-yuv3eg5qha-uc.a.run.app',
        data: {'pin': pin, 'token': token},
      );

      if (response.statusCode != 200 || response.data['status'] != 'success') {
        throw Exception(response.data['msg'] ?? 'Failed to set pincode');
      }
    } on DioException catch (e) {
      debugPrint('🔥 setPincode error: $e');
      throw Exception(e.response?.data['msg'] ?? e.message ?? 'Network error');
    } catch (e) {
      debugPrint('🔥 setPincode error: $e');
      rethrow;
    }
  }

  Future<bool> verifyPincode(String pin) async {
    try {
      final token = await _auth.currentUser?.getIdToken();
      if (token == null) return false;

      final response = await _dio.post(
        'https://verifypin-yuv3eg5qha-uc.a.run.app',
        data: {'pin': pin, 'token': token},
      );

      return response.statusCode == 200 &&
          response.data['status'] == 'success';
    } on DioException catch (e) {
      debugPrint('🔥 verifyPincode error: $e');
      return false;
    } catch (e) {
      debugPrint('🔥 verifyPincode error: $e');
      return false;
    }
  }

  Future<bool> changePincode(String currentPin, String newPin) async {
  try {
    final token = await _auth.currentUser?.getIdToken();
    if (token == null) return false;

    final response = await _dio.post(
      'https://changepin-yuv3eg5qha-uc.a.run.app',
      data: {
        'currentPin': currentPin,
        'newPin': newPin,
        'token': token,
      },
    );

    return response.statusCode == 200 &&
        response.data['status'] == 'success';
  } on DioException catch (e) {
    debugPrint('🔥 changePincode error: $e');
    return false;
  } catch (e) {
    debugPrint('🔥 changePincode error: $e');
    return false;
  }
}

  Future<MakeOrderResponse> makeOrder(
      String userId, int metalId, num quantity, String prodType, num price) async {
    final Map<String, dynamic> data = {
      "user_id": userId,
      "quantity": quantity,
      "metal_id": metalId,
      "prod_type": prodType,
      "amount": price * quantity,
      "price": price,
    };
    try {
      final Response response = await _dio.post(
        orderApi,
        data: data,
        options: Options(contentType: Headers.formUrlEncodedContentType),
      );
      return MakeOrderResponse.fromJson(response.data as Map<String, dynamic>, response.statusCode ?? 500);
    } on DioException catch (e) {
      debugPrint('🔥 makeOrder error: ${e.response?.data ?? e.message}');
      final dynamic body = e.response?.data;
      final String message = body is Map<String, dynamic>
          ? (body['message']?.toString() ?? body['error']?.toString() ?? 'Алдаа гарлаа')
          : (e.message ?? 'Алдаа гарлаа');
      return MakeOrderResponse.failure(message);
    } catch (e) {
      debugPrint('🔥 makeOrder unexpected error: $e');
      return MakeOrderResponse.failure('Алдаа гарлаа');
    }
  }

  static const String _prodBase = 'https://us-central1-grammgold.cloudfunctions.net';

  static Future<AcceptGiftResponse> acceptGift({
    required String giftId,
    required String token,
  }) async {
    try {
      final request = AcceptGiftRequest(
        giftId: giftId,
        token: token,
      );

      final response = await http.post(
        Uri.parse('$_prodBase/acceptGift'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(request.toJson()),
      );

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return AcceptGiftResponse.fromJson(responseBody);
      } else {
        throw Exception(responseBody['error'] ?? 'Failed to accept gift');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  static Future<WithdrawResponse> createWithdrawRequest({
    required String userId,
    required double quantity,
    required int metalId,
    required String pincode,
    required String token,
  }) async {
    try {
      // Get Firebase Auth token
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }
      
      final request = WithdrawRequest(
        userId: userId,
        quantity: quantity,
        metalId: metalId,
        pincode: pincode,
        token: token,
      );

      final response = await http.post(
        Uri.parse('$_prodBase/withdrawRequest'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(request.toJson()),
      );

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return WithdrawResponse.fromJson(responseBody);
      } else {
        throw Exception(responseBody['error'] ?? 'Failed to create withdraw request');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  static Future<CancelGiftResponse> cancelGift({
    required String giftId,
    required String token,
  }) async {
    try {
      final request = CancelGiftRequest(
        giftId: giftId,
        token: token,
      );

      final response = await http.post(
        Uri.parse('$_prodBase/cancelGift'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(request.toJson()),
      );

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return CancelGiftResponse.fromJson(responseBody);
      } else {
        throw Exception(responseBody['error'] ?? 'Failed to cancel gift');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Result model
  CreateGiftResult _parseCreateGiftSuccess(Map<String, dynamic> json) {
    final status = json['status']?.toString() ?? '';
    final giftId = json['gift_id']?.toString() ?? '';
    if (status.isEmpty || giftId.isEmpty) {
      throw const GiftApiException('Серверийн буцах өгөгдөл буруу байна.');
    }
    return CreateGiftResult(status: status, giftId: giftId);
  }

  // Validation helpers
  bool _isValidMnPhone(String phone) {
    final v = phone.trim();
    final re = RegExp(r'^(\+976\d{8}|\d{8})$');
    return re.hasMatch(v);
  }

  bool _isValidMetal(int metalId) => metalId == 1 || metalId == 3;

  Future<CreateGiftResult> sendGift({
    required String receiverPhone,
    required num quantity,
    required int metalId,
    required String pincode,
    String? greeting,
    bool useEmulator = false,
  }) async {
    // client-side validation
    if (!_isValidMnPhone(receiverPhone)) {
      throw const InvalidPhoneException('Утасны дугаар буруу байна. +976XXXXXXXX эсвэл 8 оронтой дугаар оруулна уу.');
    }
    if (quantity <= 0) {
      throw const GiftValidationException('Тоо хэмжээ 0-ээс их байх ёстой.');
    }
    if (!_isValidMetal(metalId)) {
      throw const GiftValidationException('Металлын төрөл буруу байна. Алт(1) эсвэл Мөнгө(3)-г сонгоно уу.');
    }

    final user = _auth.currentUser;
    if (user == null) {
      throw const GiftApiException('Нэвтрээгүй хэрэглэгч.');
    }
    final idToken = await user.getIdToken();

    const base = _prodBase;
    final uri = Uri.parse('$base/createGift');

    final payload = <String, dynamic>{
      'receiver_phone': receiverPhone.trim(),
      'quantity': quantity,
      'metal_id': metalId,
      'pincode': pincode,
      'token': idToken,
    };
    if (greeting != null && greeting.trim().isNotEmpty) {
      payload['greeting'] = greeting.trim();
    }

    try {
      final res = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      final Map<String, dynamic> body = res.body.isNotEmpty
          ? (jsonDecode(res.body) as Map<String, dynamic>)
          : <String, dynamic>{};

      if (res.statusCode == 200) {
        return _parseCreateGiftSuccess(body);
      }

      // Map known errors
      final err = (body['error']?.toString() ?? '').toLowerCase();
      if (err.contains('invalid phone') || err.contains('phone')) {
        throw const InvalidPhoneException('Хүлээн авах дугаар буруу байна.');
      }
      if (err.contains('invalid pincode') || err.contains('pin')) {
        throw const InvalidPincodeException('Пин код буруу байна.');
      }
      if (err.contains('insufficient') || err.contains('balance')) {
        throw const InsufficientBalanceException('Үлдэгдэл хүрэлцэхгүй байна.');
      }

      throw GiftApiException(body['error']?.toString() ?? 'Үл мэдэгдэх алдаа гарлаа.');
    } on http.ClientException catch (e) {
      throw GiftApiException('Сүлжээний алдаа: ${e.message}');
    } catch (e) {
      // rethrow typed exceptions
      if (e is GiftException) rethrow;
      throw GiftApiException(e.toString());
    }
  }
}

// ================== Models & Exceptions ==================
class CreateGiftResult {
  final String status; // e.g., 'pending'
  final String giftId;
  const CreateGiftResult({required this.status, required this.giftId});
}

abstract class GiftException implements Exception {
  final String message;
  const GiftException(this.message);
  @override
  String toString() => message;
}

class InvalidPhoneException extends GiftException {
  const InvalidPhoneException(String message) : super(message);
}

class InvalidPincodeException extends GiftException {
  const InvalidPincodeException(String message) : super(message);
}

class InsufficientBalanceException extends GiftException {
  const InsufficientBalanceException(String message) : super(message);
}

class GiftValidationException extends GiftException {
  const GiftValidationException(String message) : super(message);
}

class GiftApiException extends GiftException {
  const GiftApiException(String message) : super(message);
}

// ================== Example ViewModel ==================
class CreateGiftViewModel extends ChangeNotifier {
  final UserRepository repo;
  CreateGiftViewModel(this.repo);

  bool isLoading = false;
  String? error;
  CreateGiftResult? result;

  Future<void> createGift({
    required String receiverPhone,
    required num quantity,
    required int metalId,
    required String pincode,
    String? greeting,
    bool useEmulator = false,
  }) async {
    isLoading = true;
    error = null;
    result = null;
    notifyListeners();
    try {
      result = await repo.sendGift(
        receiverPhone: receiverPhone,
        quantity: quantity,
        metalId: metalId,
        pincode: pincode,
        greeting: greeting,
        useEmulator: useEmulator,
      );
    } on GiftException catch (e) {
      error = e.message; // already user-friendly
    } catch (e) {
      error = 'Алдаа гарлаа: ${e.toString()}';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
