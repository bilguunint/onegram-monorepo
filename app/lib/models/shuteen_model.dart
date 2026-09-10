import 'package:cloud_firestore/cloud_firestore.dart';

/// "Шүтээн хуур" хэсэгчилсэн эзэмшлийн хөтөлбөрийн тохиргоо —
/// Firestore `shuteen_khuur/main` doc (админаас удирдана).
class ShuteenProgramInfo {
  final String title;
  final String subtitle;
  final String description;
  final String status;
  final String? coverImage;
  final String? headerImage;
  final List<String> gallery;
  final num totalValuation;
  final int totalUnits;
  final int unitPrice;
  final int holdMonths;
  final num annualGrowthPercent;
  final int buybackPrice;
  final int soldUnits;

  const ShuteenProgramInfo({
    required this.title,
    required this.subtitle,
    required this.description,
    required this.status,
    required this.coverImage,
    required this.headerImage,
    required this.gallery,
    required this.totalValuation,
    required this.totalUnits,
    required this.unitPrice,
    required this.holdMonths,
    required this.annualGrowthPercent,
    required this.buybackPrice,
    required this.soldUnits,
  });

  bool get isActive => status == 'active';

  /// Танилцуулгын дээд зургууд: header зураг + цомог (давхардалгүй)
  List<String> get heroImages {
    final list = <String>[];
    final h = headerImage;
    if (h != null && h.isNotEmpty) list.add(h);
    for (final g in gallery) {
      if (g.isNotEmpty && !list.contains(g)) list.add(g);
    }
    return list;
  }

  /// Нэгжийн үнэлгээ [months] сарын дараа (жилийн өсөлт анхны үнээс шугаман)
  int priceAfter(int months) {
    final double factor = 1 + (annualGrowthPercent / 100) * (months / 12);
    return (unitPrice * factor).round();
  }

  /// Эзэмшлийн түвшин (1..3) эсвэл 0 — нэгжийн тоогоор
  static int tierFor(int units) {
    if (units >= 1000) return 3;
    if (units >= 500) return 2;
    if (units >= 100) return 1;
    return 0;
  }

  factory ShuteenProgramInfo.fromMap(Map<String, dynamic>? data) {
    final d = data ?? const {};
    return ShuteenProgramInfo(
      title: (d['title'] as String?) ?? 'Шүтээн хуур',
      subtitle: (d['subtitle'] as String?) ?? '',
      description: (d['description'] as String?) ?? '',
      status: (d['status'] as String?) ?? 'hidden',
      coverImage: d['cover_image'] as String?,
      headerImage: d['header_image'] as String?,
      gallery: (d['gallery'] is List)
          ? List<String>.from((d['gallery'] as List).whereType<String>())
          : const [],
      totalValuation: (d['total_valuation'] as num?) ?? 3600000000,
      totalUnits: (d['total_units'] as num?)?.toInt() ?? 100000,
      unitPrice: (d['unit_price'] as num?)?.toInt() ?? 36000,
      holdMonths: (d['hold_months'] as num?)?.toInt() ?? 24,
      annualGrowthPercent: (d['annual_growth_percent'] as num?) ?? 24,
      buybackPrice: (d['buyback_price'] as num?)?.toInt() ?? 53280,
      soldUnits: (d['sold_units'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Нэгжийн захиалга = цахим гэрчилгээ (`shuteen_orders`, CF үүсгэнэ)
class ShuteenOrder {
  final String id;
  final String buyerUid;
  final String buyerName;
  final int units;
  final int unitPrice;
  final int amount;
  final num annualGrowthPercent;
  final int holdMonths;
  final int buybackPrice;
  final int buybackTotal;
  final DateTime? buybackAt;
  final DateTime? createdAt;
  final int tier;
  final String certificateNo;
  final String signature;
  final String status;

  const ShuteenOrder({
    required this.id,
    required this.buyerUid,
    required this.buyerName,
    required this.units,
    required this.unitPrice,
    required this.amount,
    required this.annualGrowthPercent,
    required this.holdMonths,
    required this.buybackPrice,
    required this.buybackTotal,
    required this.buybackAt,
    required this.createdAt,
    required this.tier,
    required this.certificateNo,
    required this.signature,
    required this.status,
  });

  bool get isActive => status == 'active';

  /// QR-д кодлох утга — server-side HMAC гарын үсэгтэй, хуурамчаар үүсгэх боломжгүй
  String get qrPayload => 'shuteen:$certificateNo:$id:$signature';

  /// Өнөөдрийн үнэлгээ — анхны үнээс шугаман өсөлтөөр, buyback-аас хэтрэхгүй
  int get currentValue {
    final c = createdAt;
    if (c == null) return amount;
    final double months =
        DateTime.now().difference(c).inDays / 30.4375; // дундаж сар
    final double t = (months / holdMonths).clamp(0.0, 1.0);
    return (amount + (buybackTotal - amount) * t).round();
  }

  factory ShuteenOrder.fromDoc(String id, Map<String, dynamic> d) {
    DateTime? ts(dynamic v) => v is Timestamp ? v.toDate() : null;
    return ShuteenOrder(
      id: id,
      buyerUid: (d['buyer_uid'] as String?) ?? '',
      buyerName: (d['buyer_name'] as String?) ?? '',
      units: (d['units'] as num?)?.toInt() ?? 0,
      unitPrice: (d['unit_price'] as num?)?.toInt() ?? 0,
      amount: (d['amount'] as num?)?.toInt() ?? 0,
      annualGrowthPercent: (d['annual_growth_percent'] as num?) ?? 0,
      holdMonths: (d['hold_months'] as num?)?.toInt() ?? 24,
      buybackPrice: (d['buyback_price'] as num?)?.toInt() ?? 0,
      buybackTotal: (d['buyback_total'] as num?)?.toInt() ?? 0,
      buybackAt: ts(d['buyback_at']),
      createdAt: ts(d['created_at']),
      tier: (d['tier'] as num?)?.toInt() ?? 0,
      certificateNo: (d['certificate_no'] as String?) ?? '',
      signature: (d['signature'] as String?) ?? '',
      status: (d['status'] as String?) ?? 'active',
    );
  }
}

/// Эзэмшигчийн нэгтгэл (`shuteen_holders/{uid}`)
class ShuteenHolding {
  final int units;
  final int amount;
  final int orderCount;
  final int tier;

  const ShuteenHolding({
    required this.units,
    required this.amount,
    required this.orderCount,
    required this.tier,
  });

  static const empty =
      ShuteenHolding(units: 0, amount: 0, orderCount: 0, tier: 0);

  bool get hasUnits => units > 0;

  factory ShuteenHolding.fromMap(Map<String, dynamic>? d) {
    if (d == null) return empty;
    return ShuteenHolding(
      units: (d['units'] as num?)?.toInt() ?? 0,
      amount: (d['amount'] as num?)?.toInt() ?? 0,
      orderCount: (d['order_count'] as num?)?.toInt() ?? 0,
      tier: (d['tier'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Гэрчилгээ шалгасны хариу (verifyShuteenCertificate)
class ShuteenVerifyResult {
  final bool valid;
  final String reason;
  final String certificateNo;
  final int units;
  final int tier;
  final String ownerInitials;
  final String status;
  final DateTime? issuedAt;
  final DateTime? buybackAt;

  const ShuteenVerifyResult({
    required this.valid,
    required this.reason,
    required this.certificateNo,
    required this.units,
    required this.tier,
    required this.ownerInitials,
    required this.status,
    required this.issuedAt,
    required this.buybackAt,
  });

  factory ShuteenVerifyResult.fromJson(Map<String, dynamic> j) {
    DateTime? d(dynamic v) => v is String ? DateTime.tryParse(v) : null;
    return ShuteenVerifyResult(
      valid: j['valid'] == true,
      reason: (j['reason'] as String?) ?? '',
      certificateNo: (j['certificate_no'] as String?) ?? '',
      units: (j['units'] as num?)?.toInt() ?? 0,
      tier: (j['tier'] as num?)?.toInt() ?? 0,
      ownerInitials: (j['owner_initials'] as String?) ?? '',
      status: (j['status'] as String?) ?? '',
      issuedAt: d(j['issued_at']),
      buybackAt: d(j['buyback_at']),
    );
  }
}
