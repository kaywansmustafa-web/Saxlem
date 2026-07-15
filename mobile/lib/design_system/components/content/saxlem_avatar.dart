import 'package:flutter/material.dart';
import '../../foundations/saxlem_radii.dart';
import '../../theme/saxlem_colors.dart';

class SaxlemAvatar extends StatelessWidget {
  const SaxlemAvatar({
    required this.semanticLabel,
    this.imageUrl,
    this.size = 56,
    this.icon = Icons.person_rounded,
    super.key,
  });
  final String semanticLabel;
  final String? imageUrl;
  final double size;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final fallback = Icon(icon, size: size * .55, color: colors.brandPrimary);
    return Semantics(
      image: true,
      label: semanticLabel,
      child: Container(
        width: size,
        height: size,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: colors.infoSurface,
          borderRadius: BorderRadius.circular(SaxlemRadii.large),
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
