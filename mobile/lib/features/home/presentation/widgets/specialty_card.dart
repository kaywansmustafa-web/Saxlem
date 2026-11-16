import 'package:flutter/material.dart';

import '../../../../core/models/specialty.dart';
import '../../../../design_system/foundations/saxlem_elevation.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';

class SpecialtyCard extends StatefulWidget {
  const SpecialtyCard({
    required this.specialty,
    required this.semanticLabel,
    this.onTap,
    super.key,
  });

  final Specialty specialty;
  final String semanticLabel;
  final VoidCallback? onTap;

  @override
  State<SpecialtyCard> createState() => _SpecialtyCardState();
}

class _SpecialtyCardState extends State<SpecialtyCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;

    return Semantics(
      button: true,
      label: widget.semanticLabel,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
        child: Material(
          type: MaterialType.transparency,
          child: Ink(
            decoration: BoxDecoration(
              color: colors.surfaceRaised,
              borderRadius: BorderRadius.circular(SaxlemRadii.card),
              border: Border.all(color: colors.border),
              boxShadow: _pressed
                  ? SaxlemElevation.none
                  : SaxlemElevation.level1(colors.night),
            ),
            child: InkWell(
              onTap: widget.onTap,
              onHighlightChanged: (value) => setState(() => _pressed = value),
              borderRadius: BorderRadius.circular(SaxlemRadii.card),
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(8, 16, 8, 14),
                child: ExcludeSemantics(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            begin: AlignmentDirectional.topStart,
                            end: AlignmentDirectional.bottomEnd,
                            colors: [
                              colors.brandTint,
                              colors.auraEnd.withValues(alpha: .18),
                            ],
                          ),
                        ),
                        child: Icon(
                          _iconFor(widget.specialty.iconKey),
                          color: colors.brandPrimary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        widget.specialty.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.labelMedium,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _iconFor(String key) => switch (key) {
    'dentist' => Icons.medical_services_outlined,
    'cardiology' => Icons.favorite_outline_rounded,
    'pediatrics' => Icons.child_care_rounded,
    'eye' => Icons.visibility_outlined,
    'neurology' => Icons.psychology_outlined,
    _ => Icons.health_and_safety_outlined,
  };
}
