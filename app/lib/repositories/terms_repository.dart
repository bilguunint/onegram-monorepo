import 'dart:convert';
import 'dart:io' show Platform;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:onegrgold/l10n/terms_fallback.dart';
import 'package:onegrgold/models/terms_model.dart';

/// Үйлчилгээний нөхцөл: Firestore `terms/{key}` унших ба хэрэглэгчийн
/// зөвшөөрөл (гарын үсэг)-ийг `terms_acceptances`-д бүртгэх.
///
/// - Амжилттай уншсан нөхцөлийг санах ойд кэшлэнэ (апп ажиллах хугацаанд).
/// - Firestore хүрэхгүй / баримт байхгүй бол `terms_fallback.dart` дахь
///   аппд шигтгэсэн текстийг буцаана (кэшлэхгүй, дараагийн удаа дахин оролдоно).
/// - Зөвшөөрлийн баримтын id = `{uid}_{key}_v{version}` тул тухайн хувилбарыг
///   зөвшөөрсөн эсэхийг query-гүй, шууд get-ээр шалгана. Баримт зөвхөн
///   үүсгэгдэнэ, хэзээ ч өөрчлөгдөхгүй (нотлох баримт).
class TermsRepository {
  TermsRepository._();
  static final TermsRepository instance = TermsRepository._();

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final Map<String, TermsDoc> _cache = {};
  final Map<String, Future<TermsDoc>> _inflight = {};
  final Map<String, TermsAcceptance> _acceptCache = {};

  // ---------------------------------------------------------------- нөхцөл

  /// Санах ойд байгаа бол шууд (FutureBuilder-ийн initialData-д).
  TermsDoc? cached(String key) => _cache[key];

  /// Аппд шигтгэсэн нөөц текст.
  TermsDoc fallback(String key) {
    return TermsDoc(
      key: key,
      title: {for (final l in kTermsLanguages) l: localTermsTitle(key, l)},
      body: {for (final l in kTermsLanguages) l: localTermsBody(key, l)},
      version: 0,
      fromServer: false,
    );
  }

  Future<TermsDoc> load(String key) {
    final c = _cache[key];
    if (c != null) return Future.value(c);
    return _inflight[key] ??=
        _fetch(key).whenComplete(() => _inflight.remove(key));
  }

  Future<TermsDoc> _fetch(String key) async {
    try {
      final snap = await _db
          .collection('terms')
          .doc(key)
          .get()
          .timeout(const Duration(seconds: 8));
      final data = snap.data();
      if (snap.exists && data != null) {
        final doc = TermsDoc.fromMap(key, data);
        if (doc.bodyFor('mn').isNotEmpty) {
          _cache[key] = doc;
          return doc;
        }
      }
    } catch (e) {
      debugPrint('terms/$key уншихад алдаа: $e');
    }
    return fallback(key);
  }

  /// Админ шинэчилсний дараа дахин уншуулахад.
  void invalidate([String? key]) {
    if (key == null) {
      _cache.clear();
      _acceptCache.clear();
    } else {
      _cache.remove(key);
      _acceptCache.removeWhere((k, _) => k.startsWith('${key}_'));
    }
  }

  // ------------------------------------------------------------ зөвшөөрөл

  String? get _uid => FirebaseAuth.instance.currentUser?.uid;

  static String acceptanceId(String uid, String key, int version) =>
      '${uid}_${key}_v$version';

  /// Одоогийн хэрэглэгч тухайн хувилбарыг зөвшөөрч гарын үсэг зурсан эсэх.
  Future<TermsAcceptance?> acceptance(String key, int version) async {
    final uid = _uid;
    if (uid == null) return null;
    final cacheKey = '${key}_$version';
    final c = _acceptCache[cacheKey];
    if (c != null) return c;
    try {
      final snap = await _db
          .collection('terms_acceptances')
          .doc(acceptanceId(uid, key, version))
          .get()
          .timeout(const Duration(seconds: 8));
      final data = snap.data();
      if (!snap.exists || data == null) return null;
      final a = TermsAcceptance(
        termsKey: key,
        version: version,
        acceptedAt: (data['accepted_at'] as Timestamp?)?.toDate(),
      );
      _acceptCache[cacheKey] = a;
      return a;
    } catch (e) {
      debugPrint('terms_acceptances/$key уншихад алдаа: $e');
      return null;
    }
  }

  /// Хэрэглэгчийн тухайн нөхцөлд өгсөн хамгийн сүүлийн (аль ч хувилбарын)
  /// зөвшөөрөл. Нөхцөл шинэчлэгдсэнийг хэрэглэгчид хэлэхэд ашиглана.
  Future<TermsAcceptance?> latestAcceptance(String key) async {
    final uid = _uid;
    if (uid == null) return null;
    try {
      final snap = await _db
          .collection('terms_acceptances')
          .where('user_id', isEqualTo: uid)
          .where('terms_key', isEqualTo: key)
          .get()
          .timeout(const Duration(seconds: 8));
      TermsAcceptance? best;
      for (final d in snap.docs) {
        final data = d.data();
        final v = (data['version'] as num?)?.toInt() ?? 0;
        if (best == null || v > best.version) {
          best = TermsAcceptance(
            termsKey: key,
            version: v,
            acceptedAt: (data['accepted_at'] as Timestamp?)?.toDate(),
          );
        }
      }
      return best;
    } catch (e) {
      debugPrint('terms_acceptances query алдаа: $e');
      return null;
    }
  }

  /// Гарын үсэгтэй зөвшөөрлийг бүртгэнэ. [signaturePng] — PNG байт (цагаан
  /// дэвсгэр дээр хар зураас). Баримт аль хэдийн байвал дахин бичихгүй.
  Future<TermsAcceptance> recordAcceptance({
    required TermsDoc doc,
    required Uint8List signaturePng,
    required int width,
    required int height,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw StateError('Нэвтрээгүй хэрэглэгч нөхцөл зөвшөөрөх боломжгүй.');
    }
    final uid = user.uid;
    final ref = _db
        .collection('terms_acceptances')
        .doc(acceptanceId(uid, doc.key, doc.version));

    // Хэрэглэгчийн нэр, утас — админд харуулахад (өөрийн баримтаа уншина).
    String name = '';
    String phone = user.phoneNumber ?? '';
    try {
      final u = (await _db.collection('users').doc(uid).get()).data() ?? {};
      name = [u['last_name'], u['first_name']]
          .whereType<String>()
          .where((s) => s.trim().isNotEmpty)
          .join(' ');
      if (phone.isEmpty) phone = (u['phone'] ?? '').toString();
    } catch (_) {
      // нэргүй ч бүртгэнэ
    }

    await ref.set({
      'user_id': uid,
      'terms_key': doc.key,
      'version': doc.version,
      'title': doc.titleFor('mn'),
      'user_name': name,
      'user_phone': phone,
      'signature_png': base64Encode(signaturePng),
      'signature_w': width,
      'signature_h': height,
      'platform': kIsWeb ? 'web' : Platform.operatingSystem,
      'accepted_at': FieldValue.serverTimestamp(),
    });

    final a = TermsAcceptance(
      termsKey: doc.key,
      version: doc.version,
      acceptedAt: DateTime.now(),
    );
    _acceptCache['${doc.key}_${doc.version}'] = a;
    return a;
  }
}
