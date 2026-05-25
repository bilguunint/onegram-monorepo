import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum ProductStatus { active, inactive }

class Product extends Equatable {
  final String id;
  final String name;
  final String description;
  final List<String> images;
  final int price; // MNT
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
    required this.price,
    required this.minMonths,
    required this.maxMonths,
    required this.cancelFeePercent,
    required this.stock,
    required this.status,
    required this.createdAt,
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  bool get isAvailable =>
      status == ProductStatus.active && (stock == null || stock! > 0);

  factory Product.fromMap(String id, Map<String, dynamic> map) {
    return Product(
      id: id,
      name: (map['name'] ?? '') as String,
      description: (map['description'] ?? '') as String,
      images: List<String>.from(map['images'] ?? const <String>[]),
      price: _toInt(map['price']),
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
        price,
        minMonths,
        maxMonths,
        cancelFeePercent,
        stock,
        status,
      ];
}
