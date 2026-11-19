import 'package:flutter/material.dart';

/// Design A "Night Aura" colours, in a dark and a light set.
///
/// The phone's light/dark setting picks the set (or the person picks one in
/// Settings). Both sets share every name, so a screen written once looks
/// right in both. Two blues: [brandFill] is the solid blue behind white text
/// (buttons, the selected day); [brandPrimary] is blue used as text, icons
/// and outlines on a surface, lighter in the dark set so it stays readable.
@immutable
class SaxlemColors extends ThemeExtension<SaxlemColors> {
  const SaxlemColors({
    required this.isDark,
    required this.brandPrimary,
    required this.brandFill,
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
    required this.outline,
    required this.focus,
    required this.positiveSurface,
    required this.positiveContent,
    required this.cautionSurface,
    required this.cautionContent,
    required this.criticalSurface,
    required this.criticalContent,
    required this.infoSurface,
    required this.infoContent,
    required this.liveSurface,
    required this.liveContent,
    required this.liveBorder,
    required this.roseSurface,
    required this.roseContent,
    required this.lilacSurface,
    required this.lilacContent,
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
    required this.heroStart,
    required this.heroMid,
    required this.heroEnd,
    required this.heroBorder,
    required this.heroContent,
    required this.heroContentMuted,
    required this.heroStrip,
    required this.glass,
    required this.glassBorder,
    required this.glowPrimary,
    required this.glowSecondary,
    required this.track,
  });

  final bool isDark;
  final Color brandPrimary, brandFill, brandSecondary;
  final Color surfaceRaised, surfaceElevated, surfaceSunken, surfaceDisabled;
  final Color textPrimary, textSecondary, textMuted, textDisabled;

  /// [border] is the hairline around cards; [outlineStrong] the edge of a
  /// field (3:1 against its background); [outline] the edge of a secondary
  /// button.
  final Color border, divider, outlineStrong, outline, focus;
  final Color positiveSurface, positiveContent;
  final Color cautionSurface, cautionContent;
  final Color criticalSurface, criticalContent;
  final Color infoSurface, infoContent;

  /// Aqua: live things (the queue, "free today", the selected time).
  final Color liveSurface, liveContent, liveBorder;

  /// Extra hues for the symptom tiles only.
  final Color roseSurface, roseContent, lilacSurface, lilacContent;
  final Color queueReady, queueAttention, queueActionNeeded;
  final Color appointment, booking, notification;

  /// [canvas] is the app background, [night] the deep brand ground (splash,
  /// welcome) and the colour shadows are tinted with.
  final Color canvas, night, brandTint, auraStart, auraEnd, tealFill, onFill;

  /// The next-visit card: a three-stop gradient with a glowing edge.
  final Color heroStart, heroMid, heroEnd, heroBorder;
  final Color heroContent, heroContentMuted, heroStrip;

  /// Frosted bars and sheets (the only glass in the app).
  final Color glass, glassBorder;

  /// The soft lights behind the top of a screen.
  final Color glowPrimary, glowSecondary;

  /// The empty part of a progress ring or bar.
  final Color track;

  LinearGradient get aura => LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    colors: [auraStart, auraEnd],
  );

  /// For white text: the called ticket, "It's your turn".
  LinearGradient get deepAura => LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    colors: [brandFill, tealFill],
  );

  LinearGradient get hero => LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    stops: const [0, .55, 1],
    colors: [heroStart, heroMid, heroEnd],
  );

  /// Cards: a hairline edge; in the light set also a soft lift.
  List<BoxShadow> get cardShadow => isDark
      ? const []
      : const [
          BoxShadow(
            color: Color(0x0A172B78),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
          BoxShadow(
            color: Color(0x0F172B78),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ];

  static const dark = SaxlemColors(
    isDark: true,
    brandPrimary: Color(0xFF8FA8FF),
    brandFill: Color(0xFF2F5BF0),
    brandSecondary: Color(0xFF7FF0EA),
    surfaceRaised: Color(0xFF10162E),
    surfaceElevated: Color(0xFF151C3B),
    surfaceSunken: Color(0xFF18204A),
    surfaceDisabled: Color(0xFF141A33),
    textPrimary: Color(0xFFF2F5FF),
    textSecondary: Color(0xFFA9B3D6),
    textMuted: Color(0xFF8C97BF),
    textDisabled: Color(0xFF5D6688),
    border: Color(0x2494A3FF),
    divider: Color(0x1AFFFFFF),
    outlineStrong: Color(0xFF5D6890),
    outline: Color(0x29FFFFFF),
    focus: Color(0xFF8FA8FF),
    positiveSurface: Color(0x1F34D399),
    positiveContent: Color(0xFF6EE7B7),
    cautionSurface: Color(0x24FFB84D),
    cautionContent: Color(0xFFFFB84D),
    criticalSurface: Color(0x24FF6B6B),
    criticalContent: Color(0xFFFF8A8A),
    infoSurface: Color(0x332F5BF0),
    infoContent: Color(0xFFA8BCFF),
    liveSurface: Color(0x2414C9C4),
    liveContent: Color(0xFF7FF0EA),
    liveBorder: Color(0x6614C9C4),
    roseSurface: Color(0x24FF6B91),
    roseContent: Color(0xFFFF9DB4),
    lilacSurface: Color(0x299678FF),
    lilacContent: Color(0xFFC4B5FF),
    queueReady: Color(0xFF6EE7B7),
    queueAttention: Color(0xFFFFB84D),
    queueActionNeeded: Color(0xFFFF8A8A),
    appointment: Color(0xFF8FA8FF),
    booking: Color(0xFF7FF0EA),
    notification: Color(0xFFFFB84D),
    canvas: Color(0xFF070B1A),
    night: Color(0xFF03050D),
    brandTint: Color(0x332F5BF0),
    auraStart: Color(0xFF3B6BFF),
    auraEnd: Color(0xFF14C9C4),
    tealFill: Color(0xFF0A7F7A),
    onFill: Color(0xFFFFFFFF),
    heroStart: Color(0xFF1B2C72),
    heroMid: Color(0xFF101A47),
    heroEnd: Color(0xFF0B2B3B),
    heroBorder: Color(0x597896FF),
    heroContent: Color(0xFFF2F5FF),
    heroContentMuted: Color(0xFFB9C4F0),
    heroStrip: Color(0x80070B1A),
    glass: Color(0xC710162E),
    glassBorder: Color(0x1AFFFFFF),
    glowPrimary: Color(0x573B6BFF),
    glowSecondary: Color(0x2914C9C4),
    track: Color(0x12FFFFFF),
  );

  static const light = SaxlemColors(
    isDark: false,
    brandPrimary: Color(0xFF2F5BF0),
    brandFill: Color(0xFF2F5BF0),
    brandSecondary: Color(0xFF0A7F7A),
    surfaceRaised: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    surfaceSunken: Color(0xFFEEF2FC),
    surfaceDisabled: Color(0xFFEEF1F6),
    textPrimary: Color(0xFF0B1533),
    textSecondary: Color(0xFF4A5578),
    textMuted: Color(0xFF5D6785),
    textDisabled: Color(0xFF8792A8),
    border: Color(0x1A2950F5),
    divider: Color(0xFFE9EDF6),
    outlineStrong: Color(0xFF8792A8),
    outline: Color(0x240B1533),
    focus: Color(0xFF2F5BF0),
    positiveSurface: Color(0xFFE2F5EE),
    positiveContent: Color(0xFF0E7A5A),
    cautionSurface: Color(0xFFFFF1DC),
    cautionContent: Color(0xFF9A5600),
    criticalSurface: Color(0xFFFDECEA),
    criticalContent: Color(0xFFC8261B),
    infoSurface: Color(0xFFE7EDFF),
    infoContent: Color(0xFF1F3FD6),
    liveSurface: Color(0xFFDDF5F3),
    liveContent: Color(0xFF07706B),
    liveBorder: Color(0x4D0A7F7A),
    roseSurface: Color(0xFFFFE4EA),
    roseContent: Color(0xFFA3214A),
    lilacSurface: Color(0xFFECE7FF),
    lilacContent: Color(0xFF4B3699),
    queueReady: Color(0xFF0E7A5A),
    queueAttention: Color(0xFF9A5600),
    queueActionNeeded: Color(0xFFC8261B),
    appointment: Color(0xFF2F5BF0),
    booking: Color(0xFF0A7F7A),
    notification: Color(0xFF9A5600),
    canvas: Color(0xFFF3F6FD),
    night: Color(0xFF0B1533),
    brandTint: Color(0xFFE7EDFF),
    auraStart: Color(0xFF3B6BFF),
    auraEnd: Color(0xFF14C9C4),
    tealFill: Color(0xFF0A7F7A),
    onFill: Color(0xFFFFFFFF),
    heroStart: Color(0xFFE3EAFF),
    heroMid: Color(0xFFFFFFFF),
    heroEnd: Color(0xFFDDF6F4),
    heroBorder: Color(0x382F5BF0),
    heroContent: Color(0xFF0B1533),
    heroContentMuted: Color(0xFF4A5578),
    heroStrip: Color(0xC7FFFFFF),
    glass: Color(0xDBFFFFFF),
    glassBorder: Color(0x0F0B1533),
    glowPrimary: Color(0x293B6BFF),
    glowSecondary: Color(0x1F14C9C4),
    track: Color(0x120B1533),
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
