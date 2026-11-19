import 'package:flutter/material.dart';

import '../../design_system/theme/saxlem_colors.dart';

/// The icon for an Owner Portal icon key. Unknown keys (from a newer server)
/// get the hospital icon.
IconData catalogIcon(String key) => switch (key) {
  'general' => Icons.medical_services_outlined,
  'fever' => Icons.thermostat_rounded,
  'child' => Icons.child_care_rounded,
  'tooth' => Icons.sentiment_satisfied_alt_rounded,
  'skin' => Icons.spa_outlined,
  'heart' => Icons.favorite_border_rounded,
  'eye' => Icons.remove_red_eye_outlined,
  'pregnancy' => Icons.pregnant_woman_rounded,
  'bones' => Icons.accessibility_new_rounded,
  'ear' => Icons.hearing_rounded,
  'brain' => Icons.psychology_outlined,
  'stomach' => Icons.lunch_dining_outlined,
  'lungs' => Icons.air_rounded,
  'kidney' => Icons.water_drop_outlined,
  'mind' => Icons.self_improvement_rounded,
  'allergy' => Icons.grass_rounded,
  'blood' => Icons.bloodtype_outlined,
  'surgery' => Icons.healing_rounded,
  'nutrition' => Icons.restaurant_rounded,
  'women' => Icons.female_rounded,
  'men' => Icons.male_rounded,
  'elderly' => Icons.elderly_rounded,
  'vaccine' => Icons.vaccines_outlined,
  'lab' => Icons.biotech_outlined,
  _ => Icons.local_hospital_outlined,
};

/// A tile colour: (background, icon) in the current light or dark theme.
(Color, Color) toneColors(SaxlemColors colors, String tone) => switch (tone) {
  'rose' => (colors.roseSurface, colors.roseContent),
  'amber' => (colors.cautionSurface, colors.cautionContent),
  'aqua' => (colors.liveSurface, colors.liveContent),
  'lilac' => (colors.lilacSurface, colors.lilacContent),
  _ => (colors.infoSurface, colors.infoContent),
};
