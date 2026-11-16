import 'package:flutter/material.dart';
import '../../foundations/saxlem_elevation.dart';
import '../../foundations/saxlem_radii.dart';
import '../../foundations/saxlem_spacing.dart';
import '../../theme/saxlem_colors.dart';

enum SaxlemCardElevation { flat, low, medium }

class SaxlemCard extends StatelessWidget {
  const SaxlemCard({
    required this.child,
    this.padding = const EdgeInsetsDirectional.all(SaxlemSpacing.twoAndHalf),
    this.elevation = SaxlemCardElevation.low,
    this.onTap,
    this.semanticLabel,
    this.backgroundColor,
    this.borderColor,
    this.radius = SaxlemRadii.card,
    this.width,
    this.gradient,
    super.key,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final SaxlemCardElevation elevation;
  final VoidCallback? onTap;
  final String? semanticLabel;
  final Color? backgroundColor, borderColor;
  final double radius;
  final double? width;

  /// Paints the card with a gradient instead of [backgroundColor]
  /// (for example `context.saxlemColors.deepAura`).
  final Gradient? gradient;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final shadows = switch (elevation) {
      SaxlemCardElevation.flat => SaxlemElevation.none,
      SaxlemCardElevation.low => SaxlemElevation.level1(Colors.black),
      SaxlemCardElevation.medium => SaxlemElevation.level2(Colors.black),
    };
    final content = Container(
      width: width,
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null
            ? (backgroundColor ?? colors.surfaceRaised)
            : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor ?? colors.border),
        boxShadow: shadows,
      ),
      child: child,
    );
    return Semantics(
      container: true,
      button: onTap != null,
      label: semanticLabel,
      child: onTap == null
          ? content
          : Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(radius),
                child: content,
              ),
            ),
    );
  }
}
