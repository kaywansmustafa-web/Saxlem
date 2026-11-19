import 'package:flutter/material.dart';

/// Soft shadows tinted with [shadow] (pass `colors.night`): navy in the
/// light theme, near-black in the dark one, where cards lean on their
/// hairline edge instead.
abstract final class SaxlemElevation {
  static const List<BoxShadow> none = [];

  /// v3: a hairline contact shadow plus a wide, soft lift.
  static List<BoxShadow> level1(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .04),
      blurRadius: 2,
      offset: const Offset(0, 1),
    ),
    BoxShadow(
      color: shadow.withValues(alpha: .08),
      blurRadius: 28,
      spreadRadius: -12,
      offset: const Offset(0, 10),
    ),
  ];

  static List<BoxShadow> level2(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .06),
      blurRadius: 6,
      offset: const Offset(0, 2),
    ),
    BoxShadow(
      color: shadow.withValues(alpha: .12),
      blurRadius: 40,
      offset: const Offset(0, 16),
    ),
  ];

  static List<BoxShadow> level3(Color shadow) => level2(shadow);

  static List<BoxShadow> level4(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .16),
      blurRadius: 56,
      offset: const Offset(0, 24),
    ),
  ];

  /// Coloured glow under the primary button and the called ticket only.
  static List<BoxShadow> glow(Color color) => [
    BoxShadow(
      color: color.withValues(alpha: .45),
      blurRadius: 24,
      spreadRadius: -6,
      offset: const Offset(0, 8),
    ),
  ];
}
