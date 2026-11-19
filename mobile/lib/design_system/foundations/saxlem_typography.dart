import 'package:flutter/material.dart';

/// v2 "Aura" type. Every script has one font in every language:
/// Latin letters and digits are Sora (display: numbers, titles, names) and
/// Inter (reading text); Kurdish letters are Rudaw and Arabic letters Cairo.
/// The app language only decides which of Rudaw and Cairo draws the letters
/// the two scripts share (see [AppTheme.scriptFontsFor]). All families are
/// bundled, so no font is fetched at runtime and nothing falls back to the
/// phone's own fonts.
abstract final class SaxlemTypography {
  static const display = 'Sora';
  static const text = 'Inter';

  /// Letter spacing for small-caps labels: none in Kurdish and Arabic, where
  /// spacing pulls joined letters apart.
  static double tracking(BuildContext context, double value) =>
      Directionality.of(context) == TextDirection.rtl ? 0 : value;

  static TextTheme textTheme(
    TextTheme base,
    Color primary,
    Color secondary, {
    List<String> fallback = const ['Rudaw', 'Cairo'],
    bool arabicScript = false,
  }) {
    TextStyle style(
      double size,
      double line,
      FontWeight weight,
      Color color, {
      double spacing = 0,
      bool numeric = false,
      bool isDisplay = false,
    }) => TextStyle(
      fontFamily: isDisplay ? display : text,
      fontFamilyFallback: fallback,
      fontSize: size,
      height: line / size,
      fontWeight: weight,
      // Tight tracking suits Sora and Inter; it breaks Arabic-script joins.
      letterSpacing: arabicScript ? 0 : spacing,
      color: color,
      fontFeatures: numeric ? const [FontFeature.tabularFigures()] : null,
    );
    final localizedBase = base.apply(
      fontFamily: text,
      fontFamilyFallback: fallback,
    );
    return localizedBase.copyWith(
      displayLarge: style(
        40,
        46,
        FontWeight.w600,
        primary,
        spacing: -1.2,
        isDisplay: true,
      ),
      displayMedium: style(
        40,
        44,
        FontWeight.w700,
        primary,
        spacing: -1.4,
        numeric: true,
        isDisplay: true,
      ),
      headlineLarge: style(
        32,
        38,
        FontWeight.w600,
        primary,
        spacing: -.9,
        isDisplay: true,
      ),
      headlineMedium: style(
        28,
        34,
        FontWeight.w600,
        primary,
        spacing: -.6,
        isDisplay: true,
      ),
      headlineSmall: style(
        24,
        30,
        FontWeight.w600,
        primary,
        spacing: -.4,
        isDisplay: true,
      ),
      titleLarge: style(
        20,
        26,
        FontWeight.w600,
        primary,
        spacing: -.3,
        isDisplay: true,
      ),
      titleMedium: style(17, 24, FontWeight.w600, primary, spacing: -.1),
      titleSmall: style(16, 22, FontWeight.w600, primary),
      bodyLarge: style(16, 24, FontWeight.w400, primary),
      bodyMedium: style(15, 22, FontWeight.w400, secondary),
      bodySmall: style(14, 20, FontWeight.w400, secondary),
      labelLarge: style(16, 20, FontWeight.w600, primary, spacing: -.1),
      labelMedium: style(14, 18, FontWeight.w600, primary),
      labelSmall: style(12, 16, FontWeight.w600, secondary, spacing: .1),
    );
  }

  static TextStyle numeric(BuildContext context, {bool emphasized = false}) {
    final theme = Theme.of(context).textTheme;
    return (emphasized ? theme.displayMedium : theme.titleLarge)!.copyWith(
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }
}
