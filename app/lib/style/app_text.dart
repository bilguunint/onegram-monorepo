import 'package:flutter/material.dart';

import 'colors.dart';

/// Апп даяар мөрдөх нэгдсэн typography.
/// Radianpay-ийн Poppins маягийн rounded geometric дүр төрхөд
/// манай бүртгэлтэй фонтуудаас Rubik хамгийн ойр тул түүнийг ашиглана.
class AppText {
  static const String regular = "Rubik";
  static const String medium = "RubikMedium";
  static const String bold = "RubikBold";

  /// Том дүн, balance (36px)
  static const TextStyle display = TextStyle(
    fontFamily: bold,
    fontSize: 36.0,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    height: 1.1,
  );

  /// Дүнгийн нэгж дагавар (гр, ₮)
  static const TextStyle displayUnit = TextStyle(
    fontFamily: bold,
    fontSize: 20.0,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );

  /// Дэлгэцийн гарчиг (22px) — "Welcome Back!" маяг
  static const TextStyle title = TextStyle(
    fontFamily: bold,
    fontSize: 22.0,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    height: 1.2,
  );

  /// AppBar-ын гарчиг (17px) — апп даяар бүх AppBar нэг хэмжээтэй
  static const TextStyle appBarTitle = TextStyle(
    fontFamily: bold,
    fontSize: 17.0,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );

  /// Хэсгийн гарчиг (16px)
  static const TextStyle sectionTitle = TextStyle(
    fontFamily: bold,
    fontSize: 16.0,
    fontWeight: FontWeight.w600,
    color: Colors.white,
  );

  /// Мөрийн үндсэн текст (14px)
  static const TextStyle body = TextStyle(
    fontFamily: regular,
    fontSize: 14.0,
    color: Colors.white,
    height: 1.4,
  );

  static const TextStyle bodyBold = TextStyle(
    fontFamily: bold,
    fontSize: 14.0,
    fontWeight: FontWeight.w600,
    color: Colors.white,
  );

  /// Хоёрдогч тайлбар (12px, бүдэг)
  static TextStyle caption = TextStyle(
    fontFamily: regular,
    fontSize: 12.0,
    color: CustomColors.textSecondary,
    height: 1.4,
  );

  /// Жижиг шошго (11px)
  static const TextStyle label = TextStyle(
    fontFamily: medium,
    fontSize: 11.0,
    fontWeight: FontWeight.w500,
    color: Colors.white,
  );

  /// Товчлуурын текст (15px)
  static const TextStyle button = TextStyle(
    fontFamily: bold,
    fontSize: 15.0,
    fontWeight: FontWeight.w600,
    color: Colors.black,
  );

  /// "Бүгдийг харах" маягийн линк (13px accent)
  static TextStyle link = TextStyle(
    fontFamily: medium,
    fontSize: 13.0,
    fontWeight: FontWeight.w500,
    color: CustomColors.accent,
  );
}
