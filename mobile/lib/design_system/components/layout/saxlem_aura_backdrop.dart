import 'package:flutter/material.dart';

import '../../theme/saxlem_colors.dart';

/// Design A's aura: a blue light behind the top corner and an aqua one lower
/// on the other side, fading into the canvas. Pure decoration: it never sits
/// behind small text on its own, and it costs no blur passes (radial
/// gradients only).
class SaxlemAuraBackdrop extends StatelessWidget {
  const SaxlemAuraBackdrop({
    required this.child,
    this.height = 420,
    this.strength = 1,
    super.key,
  });

  final Widget child;

  /// How far down the light reaches.
  final double height;

  /// 0 to 1: quieter screens use less.
  final double strength;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    Widget orb(Color color, double size, AlignmentDirectional at) =>
        Positioned.fill(
          child: IgnorePointer(
            child: Align(
              alignment: at,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      color.withValues(alpha: color.a * strength),
                      color.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
    return Stack(
      children: [
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          height: height * 1.6,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              orb(
                colors.glowPrimary,
                height * 1.0,
                const AlignmentDirectional(1.5, -1.2),
              ),
              orb(
                colors.glowSecondary,
                height * .85,
                const AlignmentDirectional(-1.6, .55),
              ),
            ],
          ),
        ),
        child,
      ],
    );
  }
}
