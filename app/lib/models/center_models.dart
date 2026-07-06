import 'package:cloud_firestore/cloud_firestore.dart';

/// Models for the "Дэлхийн морин хуурын төв цогцолбор" donation campaign.

class CenterCampaignInfo {
  final String name;
  final String description;
  final String? coverImage;
  final String? headerImage;
  final List<String> gallery;
  final num targetAmount;
  final num totalRaised;
  final int donorCount;
  final int topCount;
  final String status;

  const CenterCampaignInfo({
    required this.name,
    required this.description,
    required this.coverImage,
    required this.headerImage,
    required this.gallery,
    required this.targetAmount,
    required this.totalRaised,
    required this.donorCount,
    required this.topCount,
    required this.status,
  });

  bool get isActive => status == 'active';

  double get progress => targetAmount > 0
      ? (totalRaised / targetAmount).clamp(0, 1).toDouble()
      : 0;

  factory CenterCampaignInfo.fromMap(Map<String, dynamic>? data) {
    final d = data ?? const {};
    return CenterCampaignInfo(
      name: (d['name'] as String?) ?? 'Дэлхийн морин хуурын төв цогцолбор',
      description: (d['description'] as String?) ?? '',
      coverImage: d['cover_image'] as String?,
      headerImage: d['header_image'] as String?,
      gallery: (d['gallery'] is List)
          ? List<String>.from((d['gallery'] as List).whereType<String>())
          : const [],
      targetAmount: (d['target_amount'] as num?) ?? 0,
      totalRaised: (d['total_raised'] as num?) ?? 0,
      donorCount: (d['donor_count'] as num?)?.toInt() ?? 0,
      topCount: (d['top_count'] as num?)?.toInt() ?? 99,
      status: (d['status'] as String?) ?? 'active',
    );
  }
}

class CenterProductItem {
  final String id;
  final String name;
  final String description;
  final List<String> images;
  final int price;
  final int? stock; // null = unlimited
  final String status;

  const CenterProductItem({
    required this.id,
    required this.name,
    required this.description,
    required this.images,
    required this.price,
    required this.stock,
    required this.status,
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;
  bool get inStock => stock == null || stock! > 0;

  factory CenterProductItem.fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final d = doc.data();
    return CenterProductItem(
      id: doc.id,
      name: (d['name'] as String?) ?? '',
      description: (d['description'] as String?) ?? '',
      images: (d['images'] is List)
          ? List<String>.from((d['images'] as List).whereType<String>())
          : const [],
      price: (d['price'] as num?)?.toInt() ?? 0,
      stock: d['stock'] == null ? null : (d['stock'] as num).toInt(),
      status: (d['status'] as String?) ?? 'active',
    );
  }
}

class CenterOrderItem {
  final String name;
  final int qty;
  final int price;

  const CenterOrderItem({
    required this.name,
    required this.qty,
    required this.price,
  });
}

class CenterDonationOrder {
  final String id;
  final List<CenterOrderItem> items;
  final int amount;
  final String status;
  final String deliveryStatus;
  final String pickupCode;
  final DateTime? createdAt;
  final DateTime? deliveredAt;

  const CenterDonationOrder({
    required this.id,
    required this.items,
    required this.amount,
    required this.status,
    required this.deliveryStatus,
    required this.pickupCode,
    required this.createdAt,
    required this.deliveredAt,
  });

  int get totalQty => items.fold(0, (s, it) => s + it.qty);
  bool get isDelivered => deliveryStatus == 'delivered';

  factory CenterDonationOrder.fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final d = doc.data();
    final rawItems = (d['items'] is List) ? d['items'] as List : const [];
    return CenterDonationOrder(
      id: doc.id,
      items: rawItems.whereType<Map>().map((m) {
        return CenterOrderItem(
          name: (m['name'] as String?) ?? '',
          qty: (m['qty'] as num?)?.toInt() ?? 1,
          price: (m['price'] as num?)?.toInt() ?? 0,
        );
      }).toList(),
      amount: (d['amount'] as num?)?.toInt() ?? 0,
      status: (d['status'] as String?) ?? 'pending',
      deliveryStatus: (d['delivery_status'] as String?) ?? 'pending',
      pickupCode: (d['pickup_code'] as String?) ?? '',
      createdAt: (d['created_at'] as Timestamp?)?.toDate(),
      deliveredAt: (d['delivered_at'] as Timestamp?)?.toDate(),
    );
  }
}

class CenterTopDonor {
  final String engraveName;
  final bool anonymous;
  final int amount;
  final int count;

  const CenterTopDonor({
    required this.engraveName,
    required this.anonymous,
    required this.amount,
    required this.count,
  });

  /// Masked donor-wall name: "Н.Бил****" — last-name initial + first name
  /// with only its first 3 letters shown, the rest replaced by `*`.
  String get displayName {
    if (anonymous) return 'Нэрээ нууцалсан';
    final raw = engraveName.trim();
    if (raw.isEmpty) return 'Нэргүй';
    final parts = raw.split(RegExp(r'\s+'));
    if (parts.length >= 2 && parts[0].isNotEmpty) {
      final lastInitial = parts[0].substring(0, 1);
      final first = parts.sublist(1).join(' ');
      return '$lastInitial.${_mask(first)}';
    }
    return _mask(raw);
  }

  static String _mask(String name) {
    if (name.length <= 3) return name;
    return name.substring(0, 3) + '*' * (name.length - 3);
  }

  factory CenterTopDonor.fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final d = doc.data();
    return CenterTopDonor(
      engraveName: (d['engrave_name'] as String?) ?? '',
      anonymous: d['anonymous'] == true,
      amount: (d['amount'] as num?)?.toInt() ?? 0,
      count: (d['count'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Current user's header stat: their display name, cumulative donated amount
/// and rank among all donors (null if they haven't donated yet).
class CenterUserHeaderStat {
  final String name;
  final int donatedAmount;
  final int? rank;

  const CenterUserHeaderStat({
    required this.name,
    required this.donatedAmount,
    required this.rank,
  });

  bool get hasDonated => donatedAmount > 0;

  static const empty =
      CenterUserHeaderStat(name: '', donatedAmount: 0, rank: null);
}
