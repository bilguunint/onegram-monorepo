import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum ProductStatus { active, inactive }

/// standard — үнэтэй, хоногоор хуваадаг ердийн бараа.
/// goldJewelry — үнэгүй, ГРАММ дээр суурилсан алтан эдлэл: хэрэглэгч тухайн
/// өдрийн ханшаар 0.1 гр-ын үржвэрээр цуглуулна (сервер: goldInstallmentShared).
enum ProductKind { standard, goldJewelry }

class Product extends Equatable {
  final String id;
  final String name;
  final String description;
  final List<String> images;
  final ProductKind kind;
  final int price; // MNT (goldJewelry бол 0)

  /// goldJewelry: эдлэлийн нийт грамм.
  final double totalGrams;
  final int minMonths;
  final int maxMonths;
  final int cancelFeePercent;
  final int? stock; // null = unlimited
  final ProductStatus status;
  final DateTime? createdAt;

  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.images,
    this.kind = ProductKind.standard,
    required this.price,
    this.totalGrams = 0,
    required this.minMonths,
    required this.maxMonths,
    required this.cancelFeePercent,
    required this.stock,
    required this.status,
    required this.createdAt,
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  bool get isGoldJewelry => kind == ProductKind.goldJewelry;

  bool get isAvailable =>
      status == ProductStatus.active && (stock == null || stock! > 0);

  factory Product.fromMap(String id, Map<String, dynamic> map) {
    return Product(
      id: id,
      name: (map['name'] ?? '') as String,
      description: (map['description'] ?? '') as String,
      images: List<String>.from(map['images'] ?? const <String>[]),
      kind: map['product_kind'] == 'gold_jewelry'
          ? ProductKind.goldJewelry
          : ProductKind.standard,
      price: _toInt(map['price']),
      totalGrams: (map['total_grams'] as num?)?.toDouble() ?? 0,
      minMonths: _toInt(map['min_months'], fallback: 1),
      maxMonths: _toInt(map['max_months'], fallback: 12),
      cancelFeePercent: _toInt(map['cancel_fee_percent']),
      stock: map['stock'] == null ? null : _toInt(map['stock']),
      status: (map['status'] == 'inactive')
          ? ProductStatus.inactive
          : ProductStatus.active,
      createdAt: (map['created_at'] is Timestamp)
          ? (map['created_at'] as Timestamp).toDate()
          : null,
    );
  }

  static int _toInt(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? fallback;
  }

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        images,
        kind,
        price,
        totalGrams,
        minMonths,
        maxMonths,
        cancelFeePercent,
        stock,
        status,
      ];
}
