import 'package:flutter/material.dart';

/// Legacy colour names kept for older widgets; values follow the v2 "Aura"
/// tokens in `design_system/theme/saxlem_colors.dart`.
abstract final class AppColors {
  static const Color primary = Color(0xFF2950F5);
  static const Color secondary = Color(0xFF14C9C4);

  static const Color white = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF5F7FB);
  static const Color textPrimary = Color(0xFF0B1533);
  static const Color textSecondary = Color(0xFF5B6680);

  static const Color success = Color(0xFF0B7A52);
  static const Color warning = Color(0xFF9A5600);
  static const Color error = Color(0xFFC8261B);

  static const Color border = Color(0xFFE4E9F2);
}
