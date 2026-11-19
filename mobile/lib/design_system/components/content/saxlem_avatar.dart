import 'package:flutter/material.dart';
import '../../foundations/saxlem_elevation.dart';
import '../../theme/saxlem_colors.dart';

class SaxlemAvatar extends StatelessWidget {
  const SaxlemAvatar({
    required this.semanticLabel,
    this.initials,
    this.imageUrl,
    this.size = 56,
    this.icon = Icons.person_rounded,
    this.ring = false,
    super.key,
  });
  final String semanticLabel;
  final String? initials;
  final String? imageUrl;
  final double size;
  final IconData icon;

  /// Doctors (v3): a rounded square in the deep aura with white initials and
  /// a soft glow, so a doctor reads differently from a patient at a glance.
  final bool ring;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final fallback = initials == null
        ? Icon(
            icon,
            size: size * .55,
            color: ring ? colors.onFill : colors.brandPrimary,
          )
        : Center(
            child: Text(
              initials!,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: ring ? colors.onFill : colors.brandPrimary,
                fontWeight: FontWeight.w700,
                fontFamily: Theme.of(context).textTheme.titleLarge?.fontFamily,
                fontSize: size * .32,
              ),
            ),
          );
    return Semantics(
      image: true,
      label: semanticLabel,
      child: Container(
        width: size,
        height: size,
        clipBehavior: Clip.antiAlias,
        decoration: ring
            ? BoxDecoration(
                gradient: colors.deepAura,
                borderRadius: BorderRadius.circular(size * .34),
                boxShadow: SaxlemElevation.glow(colors.brandPrimary),
              )
            : BoxDecoration(color: colors.brandTint, shape: BoxShape.circle),
        child: imageUrl == null
            ? fallback
            : Image.network(
                imageUrl!,
                fit: BoxFit.cover,
                frameBuilder: (context, child, frame, _) =>
                    frame == null ? fallback : child,
                errorBuilder: (_, _, _) => fallback,
              ),
      ),
    );
  }
}
