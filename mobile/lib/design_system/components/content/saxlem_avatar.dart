import 'package:flutter/material.dart';
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

  /// Adds the aqua ring used for doctors on cards and tickets.
  final bool ring;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final fallback = initials == null
        ? Icon(icon, size: size * .55, color: colors.brandPrimary)
        : Center(
            child: Text(
              initials!,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: colors.brandPrimary,
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
        decoration: BoxDecoration(
          color: colors.brandTint,
          shape: BoxShape.circle,
          boxShadow: ring
              ? [
                  BoxShadow(color: colors.surfaceRaised, spreadRadius: 2),
                  BoxShadow(color: colors.auraEnd, spreadRadius: 4),
                ]
              : null,
        ),
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
