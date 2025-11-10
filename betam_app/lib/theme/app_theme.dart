import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF13EC13);
  static const Color backgroundLight = Color(0xFFF6F8F6);
  static const Color backgroundDark = Color(0xFF102210);

  // Using system fonts to reduce app size (saves ~2-5MB vs google_fonts)
  // System fonts are optimized and look great on all devices
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: primary,
    scaffoldBackgroundColor: backgroundLight,
    fontFamily: 'Roboto', // System font, similar to Be Vietnam Pro
    colorScheme: const ColorScheme.light(
      primary: primary,
      background: backgroundLight,
      surface: backgroundLight,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: backgroundLight,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFF18181B),
        letterSpacing: -0.015,
      ),
      iconTheme: IconThemeData(
        color: Color(0xFF18181B),
      ),
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(
        color: Color(0xFF18181B),
      ),
      bodyMedium: TextStyle(
        color: Color(0xFF18181B),
      ),
      bodySmall: TextStyle(
        color: Color(0xFF71717A),
        fontSize: 14,
      ),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: primary,
    scaffoldBackgroundColor: backgroundDark,
    fontFamily: 'Roboto', // System font, similar to Be Vietnam Pro
    colorScheme: const ColorScheme.dark(
      primary: primary,
      background: backgroundDark,
      surface: backgroundDark,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: backgroundDark.withOpacity(0.8),
      elevation: 0,
      centerTitle: true,
      titleTextStyle: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFFFAFAFA),
        letterSpacing: -0.015,
      ),
      iconTheme: const IconThemeData(
        color: Color(0xFFE4E4E7),
      ),
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(
        color: Color(0xFFFAFAFA),
      ),
      bodyMedium: TextStyle(
        color: Color(0xFFFAFAFA),
      ),
      bodySmall: TextStyle(
        color: Color(0xFFA1A1AA),
        fontSize: 14,
      ),
    ),
  );
}

