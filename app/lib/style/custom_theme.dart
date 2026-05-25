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
            statusBarBrightness: Brightness.light, statusBarColor: Colors.white),
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
          .apply(fontFamily: 'Inter', bodyColor: Colors.white),
      primaryTextTheme: ThemeData.dark()
          .textTheme
          .apply(fontFamily: 'Inter', decorationColor: Colors.white),
      appBarTheme: AppBarTheme(
        surfaceTintColor: Colors.transparent,
        backgroundColor: CustomColors.scaffoldDarkBack,
        titleTextStyle: const TextStyle(
            fontFamily: 'Inter', fontSize: 14.0, fontWeight: FontWeight.bold),
        systemOverlayStyle: const SystemUiOverlayStyle(
            statusBarBrightness: Brightness.dark, statusBarColor: Colors.black),
      ),
      buttonTheme: const ButtonThemeData(buttonColor: Colors.white),
      elevatedButtonTheme: ElevatedButtonThemeData(
          style: ButtonStyle(
        overlayColor:
            MaterialStateProperty.all<Color>(Colors.black.withOpacity(0.0)),
        textStyle: MaterialStateProperty.all(
            const TextStyle(fontFamily: 'Inter', color: Colors.white)),
        backgroundColor: MaterialStateProperty.all(Colors.black),
      )),
      scaffoldBackgroundColor: CustomColors.scaffoldDarkBack,
      splashColor: Colors.black.withOpacity(0.0),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
            foregroundColor: CustomColors.mainColor,
            textStyle:
                TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: CustomColors.inputDarkColor,
        labelStyle: const TextStyle(
          color: Colors.white,
        ),
        suffixIconColor: Colors.white,
        enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(
              color: CustomColors.inputDarkColor,
            ),
            borderRadius: BorderRadius.circular(8.0)),
        focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: CustomColors.textGrey),
            borderRadius: BorderRadius.circular(8.0)),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: CustomColors.bottomDarkBack,
          selectedItemColor: CustomColors.mainColor,
          unselectedItemColor: Colors.white70,
          selectedIconTheme: const IconThemeData(color: Colors.white),
          unselectedIconTheme: const IconThemeData(color: Colors.white)),
      highlightColor: Colors.transparent,
      primaryColor: Colors.black,
      dividerColor: Colors.white54,
      iconTheme: const IconThemeData(color: Colors.white),
      primaryIconTheme: const IconThemeData(color: Colors.black87));
}
