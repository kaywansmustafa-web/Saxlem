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

  static const light = SaxlemColors(
    brandPrimary: Color(0xFF0B57D0),
    brandSecondary: Color(0xFF087F8C),
    surfaceRaised: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    surfaceSunken: Color(0xFFF0F2F4),
    surfaceDisabled: Color(0xFFF0F2F4),
    textPrimary: Color(0xFF18202A),
    textSecondary: Color(0xFF4C5967),
    textMuted: Color(0xFF687481),
    textDisabled: Color(0xFF8A949E),
    border: Color(0xFFD8DEE5),
    divider: Color(0xFFE6E9ED),
    outlineStrong: Color(0xFF9DA7B1),
    focus: Color(0xFF1769E0),
    positiveSurface: Color(0xFFDDF5EA),
    positiveContent: Color(0xFF087A55),
    cautionSurface: Color(0xFFFFF0CE),
    cautionContent: Color(0xFF8A5100),
    criticalSurface: Color(0xFFFDE9E7),
    criticalContent: Color(0xFFB42318),
    infoSurface: Color(0xFFEAF1FF),
    infoContent: Color(0xFF155EEF),
    queueReady: Color(0xFF087A55),
    queueAttention: Color(0xFF8A5100),
    queueActionNeeded: Color(0xFFB42318),
    appointment: Color(0xFF155EEF),
    booking: Color(0xFF6941C6),
    notification: Color(0xFFB54708),
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
