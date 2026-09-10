import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'colors.dart';

class CustomTheme {
  static ThemeData lightTheme = ThemeData(
      fontFamily: 'Inter',
      appBarTheme: const AppBarTheme(
        surfaceTintColor: Colors.transparent,
        backgroundColor: Colors.white,
        elevation: 0.5,
        systemOverlayStyle: SystemUiOverlayStyle(
            statusBarBrightness: Brightness.light,
            statusBarColor: Colors.white),
        titleTextStyle: TextStyle(
            fontFamily: 'Inter',
            color: Colors.black,
            fontSize: 16.0,
            fontWeight: FontWeight.bold),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
          style: ButtonStyle(
        overlayColor:
            MaterialStateProperty.all<Color>(Colors.black.withOpacity(0.0)),
        textStyle: MaterialStateProperty.all(
            const TextStyle(fontFamily: 'Inter', color: Colors.black)),
        backgroundColor: MaterialStateProperty.all(Colors.black),
      )),
      scaffoldBackgroundColor: Colors.white,
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
            foregroundColor: Colors.black,
            textStyle:
                TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: CustomColors.backGrey,
        labelStyle: const TextStyle(
          color: Colors.white,
        ),
        suffixIconColor: Colors.black87,
        enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(
              color: CustomColors.backGrey,
            ),
            borderRadius: BorderRadius.circular(8.0)),
        focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: CustomColors.textGrey),
            borderRadius: BorderRadius.circular(8.0)),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: Colors.white,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: CustomColors.darkContainerColor,
          selectedIconTheme: IconThemeData(color: Colors.black54),
          unselectedIconTheme: IconThemeData(color: Colors.black38)),
      primarySwatch: Colors.grey,
      primaryColor: Colors.white,
      brightness: Brightness.light,
      dividerColor: Colors.white54,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      iconTheme: const IconThemeData(color: Colors.black54),
      primaryIconTheme: const IconThemeData(color: Colors.black87));

  static ThemeData darkTheme = ThemeData.dark().copyWith(
      primaryColorDark: Colors.white,
      textTheme: ThemeData.dark()
          .textTheme
          .apply(fontFamily: 'Rubik', bodyColor: Colors.white),
      primaryTextTheme: ThemeData.dark()
          .textTheme
          .apply(fontFamily: 'Rubik', decorationColor: Colors.white),
      appBarTheme: AppBarTheme(
        surfaceTintColor: Colors.transparent,
        backgroundColor: CustomColors.appBackground,
        elevation: 0.0,
        titleTextStyle: const TextStyle(
            fontFamily: 'RubikBold',
            fontSize: 17.0,
            fontWeight: FontWeight.bold,
            color: Colors.white),
        systemOverlayStyle: SystemUiOverlayStyle(
            statusBarBrightness: Brightness.dark,
            statusBarColor: CustomColors.appBackground),
      ),
      buttonTheme: const ButtonThemeData(buttonColor: Colors.white),
      elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
        backgroundColor: CustomColors.accent,
        foregroundColor: Colors.black,
        elevation: 0.0,
        minimumSize: const Size.fromHeight(52.0),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.0)),
        textStyle: const TextStyle(
            fontFamily: 'RubikBold',
            fontSize: 15.0,
            fontWeight: FontWeight.w600),
      )),
      scaffoldBackgroundColor: CustomColors.appBackground,
      splashColor: Colors.black.withOpacity(0.0),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
            foregroundColor: CustomColors.accent,
            textStyle: const TextStyle(
                fontFamily: 'RubikMedium', fontWeight: FontWeight.w500)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: CustomColors.surfaceAlt,
        labelStyle: TextStyle(color: CustomColors.textSecondary),
        hintStyle: TextStyle(color: CustomColors.textTertiary),
        prefixIconColor: CustomColors.textSecondary,
        suffixIconColor: CustomColors.textSecondary,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: CustomColors.surfaceBorder),
            borderRadius: BorderRadius.circular(14.0)),
        focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: CustomColors.accent, width: 1.2),
            borderRadius: BorderRadius.circular(14.0)),
      ),
      cardColor: CustomColors.surface,
      dialogTheme: DialogThemeData(
          backgroundColor: CustomColors.surface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20.0))),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: CustomColors.bottomDarkBack,
          selectedItemColor: CustomColors.accent,
          unselectedItemColor: CustomColors.textSecondary,
          selectedIconTheme: const IconThemeData(color: Colors.white),
          unselectedIconTheme: const IconThemeData(color: Colors.white)),
      highlightColor: Colors.transparent,
      primaryColor: Colors.black,
      dividerColor: CustomColors.surfaceBorder,
      iconTheme: const IconThemeData(color: Colors.white),
      primaryIconTheme: const IconThemeData(color: Colors.black87));
}
