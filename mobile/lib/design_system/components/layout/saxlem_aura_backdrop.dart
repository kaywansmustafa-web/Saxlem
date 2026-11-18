import 'package:flutter/material.dart';

import '../../theme/saxlem_colors.dart';

/// The Saxlem aura (v3): soft blue, aqua and violet light behind the top of
/// a screen, fading into the canvas. Pure decoration: it never sits behind
/// small text, and it costs no blur passes (radial gradients only).
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
    final rtl = Directionality.of(context) == TextDirection.rtl;
    Widget orb(Color color, double size, double alpha, Alignment at) =>
        Positioned.fill(
          child: IgnorePointer(
            child: Align(
              alignment: rtl ? Alignment(-at.x, at.y) : at,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      color.withValues(alpha: alpha * strength),
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
          height: height,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              orb(
                colors.auraStart,
                height * 1.15,
                .30,
                const Alignment(1.4, -1.25),
              ),
              orb(
                colors.auraEnd,
                height * .95,
                .26,
                const Alignment(-1.35, -1.1),
              ),
              orb(
                const Color(0xFF7C5CFF),
                height * .8,
                .10,
                const Alignment(.2, -.4),
              ),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [.6, 1],
                      colors: [
                        colors.canvas.withValues(alpha: 0),
                        colors.canvas,
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        child,
      ],
    );
  }
}
