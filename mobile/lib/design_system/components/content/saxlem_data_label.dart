import 'package:flutter/material.dart';

import '../../foundations/saxlem_typography.dart';
import '../../theme/saxlem_colors.dart';

/// Design A's small data label ("NEXT VISIT", "YOUR NUMBER"): monospaced
/// capitals with open spacing in English. Kurdish and Arabic have no
/// capitals and must not be spaced apart, so there it is plain text in the
/// language's own font, a touch larger.
class SaxlemDataLabel extends StatelessWidget {
  const SaxlemDataLabel(this.text, {this.color, this.size = 11, super.key});
  final String text;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final base = Theme.of(context).textTheme.labelSmall;
    final tint = color ?? context.saxlemColors.textSecondary;
    return Text(
      rtl ? text : text.toUpperCase(),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: rtl
          ? base?.copyWith(
              color: tint,
              fontSize: size + 2,
              fontWeight: FontWeight.w500,
            )
          : base?.copyWith(
              color: tint,
              fontFamily: SaxlemTypography.mono,
              fontSize: size,
              fontWeight: FontWeight.w500,
              letterSpacing: size * .08,
            ),
    );
  }
}
