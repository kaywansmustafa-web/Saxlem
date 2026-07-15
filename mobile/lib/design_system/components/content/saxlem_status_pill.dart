import 'package:flutter/material.dart';
import '../../foundations/saxlem_radii.dart';
import '../../foundations/saxlem_spacing.dart';
import '../../theme/saxlem_colors.dart';

enum SaxlemStatusTone { neutral, informative, positive, caution, critical }

class SaxlemStatusPill extends StatelessWidget {
  const SaxlemStatusPill({
    required this.label,
    this.tone = SaxlemStatusTone.neutral,
    this.icon,
    super.key,
  });
  final String label;
  final SaxlemStatusTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final (surface, content) = switch (tone) {
      SaxlemStatusTone.informative => (colors.infoSurface, colors.infoContent),
      SaxlemStatusTone.positive => (
        colors.positiveSurface,
        colors.positiveContent,
      ),
      SaxlemStatusTone.caution => (
        colors.cautionSurface,
        colors.cautionContent,
      ),
      SaxlemStatusTone.critical => (
        colors.criticalSurface,
        colors.criticalContent,
      ),
      SaxlemStatusTone.neutral => (colors.surfaceSunken, colors.textSecondary),
    };
    return Semantics(
      label: label,
      child: Container(
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: SaxlemSpacing.oneAndHalf,
          vertical: SaxlemSpacing.half,
        ),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(SaxlemRadii.full),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: content),
              const SizedBox(width: SaxlemSpacing.half),
            ],
            Flexible(
              child: Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(color: content),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
