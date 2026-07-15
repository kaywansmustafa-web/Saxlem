import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class SaxlemTypography {
  static TextTheme textTheme(TextTheme base, Color primary, Color secondary) {
    TextStyle style(
      double size,
      double line,
      FontWeight weight,
      Color color, {
      double spacing = 0,
      bool numeric = false,
    }) => GoogleFonts.notoSans(
      fontSize: size,
      height: line / size,
      fontWeight: weight,
      letterSpacing: spacing,
      color: color,
      fontFeatures: numeric ? const [FontFeature.tabularFigures()] : null,
    );
    return GoogleFonts.notoSansTextTheme(base).copyWith(
      displayLarge: style(40, 48, FontWeight.w700, primary, spacing: -.4),
      displayMedium: style(
        38,
        44,
        FontWeight.w800,
        primary,
        spacing: -.3,
        numeric: true,
      ),
      headlineLarge: style(32, 40, FontWeight.w700, primary, spacing: -.3),
      headlineMedium: style(28, 36, FontWeight.w700, primary, spacing: -.2),
      headlineSmall: style(24, 32, FontWeight.w700, primary, spacing: -.1),
      titleLarge: style(22, 30, FontWeight.w700, primary),
      titleMedium: style(18, 26, FontWeight.w600, primary),
      titleSmall: style(16, 24, FontWeight.w600, primary),
      bodyLarge: style(17, 26, FontWeight.w400, primary),
      bodyMedium: style(15, 23, FontWeight.w400, secondary),
      bodySmall: style(14, 20, FontWeight.w400, secondary),
      labelLarge: style(15, 20, FontWeight.w600, primary, spacing: .1),
      labelMedium: style(14, 18, FontWeight.w600, primary, spacing: .1),
      labelSmall: style(12, 16, FontWeight.w600, secondary, spacing: .2),
    );
  }

  static TextStyle numeric(BuildContext context, {bool emphasized = false}) {
    final theme = Theme.of(context).textTheme;
    return (emphasized ? theme.displayMedium : theme.titleMedium)!.copyWith(
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }
}
