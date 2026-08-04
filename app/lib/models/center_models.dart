import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:onegrgold/l10n/app_locale.dart';

/// Models for the "Дэлхийн морин хуурын төв цогцолбор" donation campaign.

/// Optional promo modal shown when the campaign detail screen opens.
class CenterPopupInfo {
  final bool enabled;
  final String? image;
  final String title;
  final String body;

  const CenterPopupInfo({
    required this.enabled,
    required this.image,
    required this.title,
    required this.body,
  });

  static const empty =
      CenterPopupInfo(enabled: false, image: null, title: '', body: '');

  /// Worth showing only when switched on and carrying at least one of the
  /// three content slots.
  bool get hasContent =>
      enabled &&
      ((image != null && image!.isNotEmpty) ||
          title.trim().isNotEmpty ||
          body.trim().isNotEmpty);

  factory CenterPopupInfo.fromMap(Map<String, dynamic>? data) {
    final d = data ?? const {};
    return CenterPopupInfo(
      enabled: d['enabled'] == true,
      image: d['image'] as String?,
      title: (d['title'] as String?) ?? '',
      body: (d['body'] as String?) ?? '',
    );
  }
}

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
  final int treeCount;
  final int treeDonorCount;
  final String status;
  final CenterPopupInfo popup;

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
    required this.treeCount,
    required this.treeDonorCount,
    required this.status,
    required this.popup,
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
      treeCount: (d['tree_count'] as num?)?.toInt() ?? 0,
      treeDonorCount: (d['tree_donor_count'] as num?)?.toInt() ?? 0,
      status: (d['status'] as String?) ?? 'active',
      popup: CenterPopupInfo.fromMap(
        (d['popup'] as Map<String, dynamic>?),
      ),
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

/// A plantable tree (product shape + botanical facts) from `center_trees`.
class CenterTreeItem {
  final String id;
  final String name;
  final String description;
  final List<String> images;
  final int price;
  final int? stock; // null = unlimited
  final String status;
  final String? categoryId;
  final String seedlingHeight; // Суулгацын өндөр, ж: "80–120 см"
  final String matureHeight; // Нас биенд хүрсэн өндөр, ж: "20–35 м"
  final String lifespan; // Насжилт, ж: "300–500 жил"
  final String features; // Онцлог
  final DateTime? createdAt;

  const CenterTreeItem({
    required this.id,
    required this.name,
    required this.description,
    required this.images,
    required this.price,
    required this.stock,
    required this.status,
    required this.categoryId,
    required this.seedlingHeight,
    required this.matureHeight,
    required this.lifespan,
    required this.features,
    required this.createdAt,
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;
  bool get inStock => stock == null || stock! > 0;

  factory CenterTreeItem.fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final d = doc.data();
    return CenterTreeItem(
      id: doc.id,
      name: (d['name'] as String?) ?? '',
      description: (d['description'] as String?) ?? '',
      images: (d['images'] is List)
          ? List<String>.from((d['images'] as List).whereType<String>())
          : const [],
      price: (d['price'] as num?)?.toInt() ?? 0,
      stock: d['stock'] == null ? null : (d['stock'] as num).toInt(),
      status: (d['status'] as String?) ?? 'active',
      categoryId: d['category_id'] as String?,
      seedlingHeight: (d['seedling_height'] as String?) ?? '',
      matureHeight: (d['mature_height'] as String?) ?? '',
      lifespan: (d['lifespan'] as String?) ?? '',
      features: (d['features'] as String?) ?? '',
      createdAt: (d['created_at'] as Timestamp?)?.toDate(),
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

/// A user's tree-planting order (from `center_tree_orders`).
class CenterTreeOrder {
  final String id;
  final String treeName;
  final String? treeImage;
  final String labelName;
  final int qty;
  final int amount;
  final String plantingStatus; // 'pending' | 'planted'
  final DateTime? createdAt;
  final DateTime? plantedAt;

  const CenterTreeOrder({
    required this.id,
    required this.treeName,
    required this.treeImage,
    required this.labelName,
    required this.qty,
    required this.amount,
    required this.plantingStatus,
    required this.createdAt,
    required this.plantedAt,
  });

  bool get isPlanted => plantingStatus == 'planted';

  factory CenterTreeOrder.fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final d = doc.data();
    return CenterTreeOrder(
      id: doc.id,
      treeName: (d['tree_name'] as String?) ?? '',
      treeImage: d['tree_image'] as String?,
      labelName: (d['label_name'] as String?) ?? '',
      qty: (d['qty'] as num?)?.toInt() ?? 1,
      amount: (d['amount'] as num?)?.toInt() ?? 0,
      plantingStatus: (d['planting_status'] as String?) ?? 'pending',
      createdAt: (d['created_at'] as Timestamp?)?.toDate(),
      plantedAt: (d['planted_at'] as Timestamp?)?.toDate(),
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
    if (anonymous) return tr('center.anonymous_donor');
    final raw = engraveName.trim();
    if (raw.isEmpty) return tr('center.unnamed');
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
  final int treeCount;

  const CenterUserHeaderStat({
    required this.name,
    required this.donatedAmount,
    required this.rank,
    this.treeCount = 0,
  });

  bool get hasDonated => donatedAmount > 0;

  static const empty =
      CenterUserHeaderStat(name: '', donatedAmount: 0, rank: null);
}
