import 'package:flutter/material.dart';

abstract final class SaxlemElevation {
  static const List<BoxShadow> none = [];

  static List<BoxShadow> level1(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .05),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> level2(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .07),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> level3(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .09),
      blurRadius: 32,
      offset: const Offset(0, 12),
    ),
  ];

  static List<BoxShadow> level4(Color shadow) => [
    BoxShadow(
      color: shadow.withValues(alpha: .12),
      blurRadius: 48,
      offset: const Offset(0, 20),
    ),
  ];
}
