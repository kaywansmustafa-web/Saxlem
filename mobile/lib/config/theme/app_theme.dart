import 'package:flutter/material.dart';

import '../../design_system/foundations/saxlem_radii.dart';
import '../../design_system/foundations/saxlem_sizes.dart';
import '../../design_system/foundations/saxlem_typography.dart';
import '../../design_system/theme/saxlem_colors.dart';

/// The app theme, built from the v2 "Aura" tokens. Most screens use stock
/// Material widgets, so the component themes below carry the new look to every
/// screen: 52px buttons with 14px corners, 60px inputs with a focus ring,
/// 20px cards and 28px sheets on the light canvas.
abstract final class AppTheme {
  static ThemeData get light => lightFor();

  /// The font that draws this language's letters: Cairo for Arabic, Rudaw
  /// for Badini, none for English (Latin is always Sora / Inter).
  static String? fontFamilyFor(Locale? locale) =>
      switch (locale?.languageCode) {
        'ar' => 'Cairo',
        'ku' => 'Rudaw',
        _ => null,
      };

  /// Fonts for letters Sora and Inter don't have. Kurdish letters are always
  /// Rudaw and Arabic letters always Cairo; the language picks which draws
  /// the letters both scripts share. On English screens, names written in
  /// Kurdish or Arabic use Rudaw first (Duhok names are mostly Kurdish).
  static List<String> scriptFontsFor(Locale? locale) =>
      switch (locale?.languageCode) {
        'ar' => const ['Cairo', 'Rudaw'],
        _ => const ['Rudaw', 'Cairo'],
      };

  static ThemeData lightFor([Locale? locale]) {
    const c = SaxlemColors.light;
    final arabicScript = fontFamilyFor(locale) != null;
    final fallback = scriptFontsFor(locale);
    const textFamily = SaxlemTypography.text;
    const displayFamily = SaxlemTypography.display;
    final scheme = ColorScheme.fromSeed(
      seedColor: c.brandPrimary,
      primary: c.brandPrimary,
      onPrimary: c.onFill,
      primaryContainer: c.brandTint,
      onPrimaryContainer: c.brandPrimary,
      secondary: c.brandSecondary,
      onSecondary: c.onFill,
      tertiary: c.auraEnd,
      error: c.criticalContent,
      errorContainer: c.criticalSurface,
      surface: c.surfaceRaised,
      onSurface: c.textPrimary,
      onSurfaceVariant: c.textSecondary,
      surfaceContainerLowest: c.surfaceRaised,
      surfaceContainerLow: c.canvas,
      surfaceContainer: c.surfaceSunken,
      surfaceContainerHigh: c.surfaceSunken,
      surfaceContainerHighest: c.surfaceSunken,
      outline: c.outlineStrong,
      outlineVariant: c.border,
      shadow: c.night,
    );
    final baseTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.canvas,
      fontFamily: textFamily,
      fontFamilyFallback: fallback,
      splashFactory: InkSparkle.splashFactory,
    );
    final textTheme = SaxlemTypography.textTheme(
      baseTheme.textTheme,
      c.textPrimary,
      c.textSecondary,
      fallback: fallback,
      arabicScript: arabicScript,
    );
    final buttonText = TextStyle(
      fontFamily: textFamily,
      fontFamilyFallback: fallback,
      fontSize: 16,
      height: 1.25,
      fontWeight: FontWeight.w600,
      letterSpacing: arabicScript ? 0 : -.1,
    );
    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(SaxlemRadii.large),
    );
    const buttonSize = Size(64, 52);
    const buttonPadding = EdgeInsetsDirectional.symmetric(horizontal: 22);
    OutlineInputBorder inputBorder(Color color, [double width = 1.5]) =>
        OutlineInputBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.large),
          borderSide: BorderSide(color: color, width: width),
        );

    return baseTheme.copyWith(
      extensions: const [SaxlemColors.light],
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: c.canvas,
        surfaceTintColor: Colors.transparent,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: displayFamily,
          fontFamilyFallback: fallback,
          fontSize: 20,
          height: 1.3,
          fontWeight: FontWeight.w600,
          letterSpacing: arabicScript ? 0 : -.3,
          color: c.textPrimary,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.brandPrimary,
          foregroundColor: c.onFill,
          disabledBackgroundColor: c.surfaceSunken,
          disabledForegroundColor: c.textDisabled,
          minimumSize: buttonSize,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.brandPrimary,
          foregroundColor: c.onFill,
          elevation: 0,
          minimumSize: const Size(
            double.infinity,
            SaxlemSizes.minimumTouchTarget + 4,
          ),
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.textPrimary,
          backgroundColor: c.surfaceRaised,
          side: BorderSide(color: c.outlineStrong),
          minimumSize: buttonSize,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.brandPrimary,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsetsDirectional.symmetric(horizontal: 14),
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: c.textPrimary,
          minimumSize: const Size(48, 48),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceRaised,
        contentPadding: const EdgeInsetsDirectional.symmetric(
          horizontal: 16,
          vertical: 18,
        ),
        labelStyle: TextStyle(
          color: c.textSecondary,
          fontFamily: textFamily,
          fontFamilyFallback: fallback,
        ),
        floatingLabelStyle: TextStyle(
          color: c.brandPrimary,
          fontWeight: FontWeight.w600,
          fontFamily: textFamily,
          fontFamilyFallback: fallback,
        ),
        hintStyle: TextStyle(
          color: c.textSecondary,
          fontFamily: textFamily,
          fontFamilyFallback: fallback,
        ),
        prefixIconColor: c.textSecondary,
        border: inputBorder(c.outlineStrong),
        enabledBorder: inputBorder(c.outlineStrong),
        focusedBorder: inputBorder(c.focus, 2),
        errorBorder: inputBorder(c.criticalContent),
        focusedErrorBorder: inputBorder(c.criticalContent, 2),
        disabledBorder: inputBorder(c.border),
      ),
      cardTheme: CardThemeData(
        color: c.surfaceRaised,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.card),
          side: BorderSide(color: c.border),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: c.surfaceRaised,
        selectedColor: c.brandPrimary,
        secondarySelectedColor: c.brandPrimary,
        checkmarkColor: c.onFill,
        side: BorderSide(color: c.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.small),
        ),
        labelStyle: TextStyle(
          fontFamily: textFamily,
          fontFamilyFallback: fallback,
          fontWeight: FontWeight.w600,
          color: c.textPrimary,
        ),
        secondaryLabelStyle: TextStyle(
          fontFamily: textFamily,
          fontFamilyFallback: fallback,
          fontWeight: FontWeight.w600,
          color: c.onFill,
        ),
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 10,
          vertical: 8,
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surfaceRaised,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: c.border,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(SaxlemRadii.hero),
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surfaceRaised,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.hero),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.night,
        contentTextStyle: TextStyle(
          fontFamily: textFamily,
          fontFamilyFallback: fallback,
          color: c.onFill,
          fontSize: 15,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.medium),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.brandPrimary,
        linearTrackColor: c.surfaceSunken,
        circularTrackColor: c.surfaceSunken,
      ),
      dividerTheme: DividerThemeData(color: c.divider, space: 1),
      listTileTheme: ListTileThemeData(
        iconColor: c.textSecondary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.medium),
        ),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          selectedBackgroundColor: c.brandPrimary,
          selectedForegroundColor: c.onFill,
          side: BorderSide(color: c.border),
          textStyle: buttonText.copyWith(fontSize: 14),
        ),
      ),
      badgeTheme: BadgeThemeData(
        backgroundColor: c.criticalContent,
        textColor: c.onFill,
      ),
    );
  }
}
