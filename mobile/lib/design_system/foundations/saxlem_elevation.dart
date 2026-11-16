import 'package:flutter/material.dart';

/// Soft, navy-tinted shadows (v2 "Aura"). The [shadow] argument is kept for
/// compatibility; depth is always tinted with the brand's night colour.
abstract final class SaxlemElevation {
  static const List<BoxShadow> none = [];
  static const Color _night = Color(0xFF0B1533);

  static List<BoxShadow> level1(Color shadow) => [
    BoxShadow(
      color: _night.withValues(alpha: .05),
      blurRadius: 2,
      offset: const Offset(0, 1),
    ),
    BoxShadow(
      color: _night.withValues(alpha: .06),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> level2(Color shadow) => [
    BoxShadow(
      color: _night.withValues(alpha: .06),
      blurRadius: 6,
      offset: const Offset(0, 2),
    ),
    BoxShadow(
      color: _night.withValues(alpha: .12),
      blurRadius: 40,
      offset: const Offset(0, 16),
    ),
  ];

  static List<BoxShadow> level3(Color shadow) => level2(shadow);

  static List<BoxShadow> level4(Color shadow) => [
    BoxShadow(
      color: _night.withValues(alpha: .16),
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
