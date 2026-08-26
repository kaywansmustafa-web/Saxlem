import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import '../../design_system/foundations/saxlem_radii.dart';
import '../../design_system/foundations/saxlem_sizes.dart';
import '../../design_system/foundations/saxlem_typography.dart';
import '../../design_system/theme/saxlem_colors.dart';

abstract final class AppTheme {
  static ThemeData get light => lightFor();

  static String? fontFamilyFor(Locale? locale) =>
      switch (locale?.languageCode) {
        'ar' => 'Cairo',
        'ku' => 'Rudaw',
        _ => null,
      };

  static ThemeData lightFor([Locale? locale]) {
    final fontFamily = fontFamilyFor(locale);
    final baseTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: SaxlemColors.light.brandPrimary,
        primary: SaxlemColors.light.brandPrimary,
        secondary: SaxlemColors.light.brandSecondary,
        error: SaxlemColors.light.criticalContent,
        surface: SaxlemColors.light.surfaceRaised,
      ),
      scaffoldBackgroundColor: AppColors.background,
      fontFamily: fontFamily,
    );

    return baseTheme.copyWith(
      extensions: const [SaxlemColors.light],
      textTheme: SaxlemTypography.textTheme(
        baseTheme.textTheme,
        SaxlemColors.light.textPrimary,
        SaxlemColors.light.textSecondary,
        fontFamily: fontFamily,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: SaxlemColors.light.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: _style(
          fontFamily,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: SaxlemColors.light.textPrimary,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SaxlemColors.light.brandPrimary,
          foregroundColor: AppColors.white,
          minimumSize: const Size(
            double.infinity,
            SaxlemSizes.minimumTouchTarget,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(SaxlemRadii.large),
          ),
          textStyle: _style(
            fontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SaxlemColors.light.surfaceRaised,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.large),
          borderSide: BorderSide(color: SaxlemColors.light.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.large),
          borderSide: BorderSide(color: SaxlemColors.light.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.large),
          borderSide: BorderSide(color: SaxlemColors.light.focus, width: 2),
        ),
      ),
    );
  }

  static TextStyle _style(
    String? fontFamily, {
    required double fontSize,
    required FontWeight fontWeight,
    Color? color,
  }) => fontFamily == null
      ? GoogleFonts.notoSans(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
        )
      : TextStyle(
          fontFamily: fontFamily,
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
        );
}
