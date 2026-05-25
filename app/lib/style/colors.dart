import 'dart:ui';
import 'package:flutter/cupertino.dart';

class CustomColors {
  static Color mainColor = const Color(0xFFFCD535);
  static Color mainOrange = const Color(0xFFf27336);
  static Color mainBlack = const Color(0xFF1E2329);
  static Color mainRed = const Color(0xFFC2240B);
  static Color mainSilver = const Color.fromARGB(255, 243, 242, 242);
  static Color secondaryColor = const Color(0xFF0c1c3b);
  static Color mainTextColor = const Color(0xFF0f153b);
  static Color goldYellow = const Color(0xFFf7ca18);
  static Color pink = const Color(0xFFe33d94);
  static Color brown = const Color(0xFF6b3e2e);
  static Color imageBackground = const Color(0xFFEEEEEE);
  static Color activeGreen = const Color(0xFF5fdba7);
  static Color alerRed = const Color(0xFFc44d56);
  static Color grey = const Color(0xFFEEEEEE);
  static Color textBlack = const Color(0xFF232323);
  static Color textGrey = const Color(0xFF99A0B0);
  static Color lightBackground = const Color(0xFFf8f8f8);
  static Color blue = const Color(0xFF027BCE);
  static Color bottomDarkBack = const Color(0xFF121212);
  static Color inputDarkColor = const Color(0xFF353539);
  static Color buttonBackground = const Color(0xFF121212);
  static Color scaffoldDarkBack = const Color(0xFF1c1c1e);
  static Color backGrey = const Color(0xFFf6f6f6);
  static Color loginGradientStart = const Color.fromARGB(255, 91, 67, 196);
  static Color loginGradientEnd = const Color(0xFF59499E);
  static Color successGreen = const Color(0xFF32CD32);
  static Color thirdColor = const Color(0xFFFFD684);
  static Color fourthColor = const Color(0xFF8FDCFF);
  static Color elementBack = const Color(0xfff1efef);
  static Color titleColor = const Color(0xFF061857);
  static Color orange = const Color(0xFFe67e22);
  static Color darkBackground = const Color(0xFF333333);
  static Color darkContainerColor = const Color(0xFF161618);

  static LinearGradient mainGradient = const LinearGradient(
      colors: [
        Color(0xFFECC440),
        Color(0xFFFFFA8A),
        Color(0xFFDDAC17),
        Color(0xFFFFFF95)
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      stops: [0.0, 0.25, 0.75, 1.0],
      tileMode: TileMode.clamp);
  static LinearGradient mainSilverGradient = const LinearGradient(
      colors: [
        Color(0xFFb4b5b8),
        Color(0xFFc0c0c3),
        Color(0xFFcbcccd),
        Color(0xFFe3e3e3)
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      stops: [0.0, 0.25, 0.75, 1.0],
      tileMode: TileMode.clamp);

  static LinearGradient grammGradient = const LinearGradient(
      colors: [
        Color(0xFFECC440),
        Color(0xFFFFFA8A),
        Color(0xFFDDAC17),
        Color(0xFFFFFF95)
      ],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      stops: [0.0, 0.25, 0.75, 1.0],
      tileMode: TileMode.clamp);
}
