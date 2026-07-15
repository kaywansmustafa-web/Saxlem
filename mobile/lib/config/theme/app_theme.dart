import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import '../../design_system/foundations/saxlem_radii.dart';
import '../../design_system/foundations/saxlem_sizes.dart';
import '../../design_system/foundations/saxlem_typography.dart';
import '../../design_system/theme/saxlem_colors.dart';

abstract final class AppTheme {
  static ThemeData get light {
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
    );

    return baseTheme.copyWith(
      extensions: const [SaxlemColors.light],
      textTheme: SaxlemTypography.textTheme(
        baseTheme.textTheme,
        SaxlemColors.light.textPrimary,
        SaxlemColors.light.textSecondary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: SaxlemColors.light.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.notoSans(
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
          textStyle: GoogleFonts.notoSans(
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
}
