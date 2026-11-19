import 'package:flutter/material.dart';
import '../../foundations/saxlem_radii.dart';
import '../../theme/saxlem_colors.dart';

/// Colour only means something: positive = on time / confirmed, live = the
/// queue is moving now, caution = running late, informative = your turn
/// soon, critical = cancelled or failed.
enum SaxlemStatusTone {
  neutral,
  informative,
  positive,
  caution,
  critical,
  live,
}

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
      SaxlemStatusTone.live => (colors.liveSurface, colors.liveContent),
      SaxlemStatusTone.neutral => (colors.surfaceSunken, colors.textSecondary),
    };
    return Semantics(
      label: label,
      child: Container(
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 12,
          vertical: 5,
        ),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(SaxlemRadii.full),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null)
              Icon(icon, size: 16, color: content)
            else
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: content,
                  shape: BoxShape.circle,
                  boxShadow: tone == SaxlemStatusTone.live
                      ? [BoxShadow(color: content, blurRadius: 8)]
                      : null,
                ),
              ),
            const SizedBox(width: 6),
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
