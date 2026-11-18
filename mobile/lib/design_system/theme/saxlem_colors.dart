import 'package:flutter/material.dart';

@immutable
class SaxlemColors extends ThemeExtension<SaxlemColors> {
  const SaxlemColors({
    required this.brandPrimary,
    required this.brandSecondary,
    required this.surfaceRaised,
    required this.surfaceElevated,
    required this.surfaceSunken,
    required this.surfaceDisabled,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.textDisabled,
    required this.border,
    required this.divider,
    required this.outlineStrong,
    required this.focus,
    required this.positiveSurface,
    required this.positiveContent,
    required this.cautionSurface,
    required this.cautionContent,
    required this.criticalSurface,
    required this.criticalContent,
    required this.infoSurface,
    required this.infoContent,
    required this.queueReady,
    required this.queueAttention,
    required this.queueActionNeeded,
    required this.appointment,
    required this.booking,
    required this.notification,
    required this.canvas,
    required this.night,
    required this.brandTint,
    required this.auraStart,
    required this.auraEnd,
    required this.tealFill,
    required this.onFill,
  });

  final Color brandPrimary, brandSecondary;
  final Color surfaceRaised, surfaceElevated, surfaceSunken, surfaceDisabled;
  final Color textPrimary, textSecondary, textMuted, textDisabled;
  final Color border, divider, outlineStrong, focus;
  final Color positiveSurface, positiveContent;
  final Color cautionSurface, cautionContent;
  final Color criticalSurface, criticalContent;
  final Color infoSurface, infoContent;
  final Color queueReady, queueAttention, queueActionNeeded;
  final Color appointment, booking, notification;

  /// v2 "Aura" additions. [canvas] is the app background, [night] the deep
  /// brand ground. The Aura gradient ([auraStart] → [auraEnd]) is decoration
  /// only and never sits behind text; [deepAura] (brand → [tealFill]) is the
  /// gradient for white text (called ticket, selected day).
  final Color canvas, night, brandTint, auraStart, auraEnd, tealFill, onFill;

  LinearGradient get aura => LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    colors: [auraStart, auraEnd],
  );

  LinearGradient get deepAura => LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    colors: [brandPrimary, tealFill],
  );

  static const light = SaxlemColors(
    brandPrimary: Color(0xFF2950F5),
    brandSecondary: Color(0xFF0A7F7A),
    surfaceRaised: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    surfaceSunken: Color(0xFFF2F4F9),
    surfaceDisabled: Color(0xFFEEF1F6),
    textPrimary: Color(0xFF0B1533),
    textSecondary: Color(0xFF5E6A86),
    textMuted: Color(0xFF5B6680),
    textDisabled: Color(0xFF8792A8),
    border: Color(0xFFE8ECF3),
    divider: Color(0xFFEEF1F6),
    outlineStrong: Color(0xFF8792A8),
    focus: Color(0xFF2950F5),
    positiveSurface: Color(0xFFE5F6EE),
    positiveContent: Color(0xFF0B7A52),
    cautionSurface: Color(0xFFFFF3D9),
    cautionContent: Color(0xFF9A5600),
    criticalSurface: Color(0xFFFDECEA),
    criticalContent: Color(0xFFC8261B),
    infoSurface: Color(0xFFEEF2FF),
    infoContent: Color(0xFF2950F5),
    queueReady: Color(0xFF0B7A52),
    queueAttention: Color(0xFF9A5600),
    queueActionNeeded: Color(0xFFC8261B),
    appointment: Color(0xFF2950F5),
    booking: Color(0xFF0A7F7A),
    notification: Color(0xFF9A5600),
    canvas: Color(0xFFF3F5FA),
    night: Color(0xFF0B1533),
    brandTint: Color(0xFFEEF2FF),
    auraStart: Color(0xFF3B6BFF),
    auraEnd: Color(0xFF14C9C4),
    tealFill: Color(0xFF0A7F7A),
    onFill: Color(0xFFFFFFFF),
  );

  @override
  SaxlemColors copyWith() => this;

  @override
  SaxlemColors lerp(covariant SaxlemColors? other, double t) =>
      other == null ? this : (t < .5 ? this : other);
}

extension SaxlemThemeContext on BuildContext {
  SaxlemColors get saxlemColors =>
      Theme.of(this).extension<SaxlemColors>() ?? SaxlemColors.light;
}
