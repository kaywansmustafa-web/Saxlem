import 'dart:math' as math;

import 'package:flutter/material.dart';

/// The friendly shapes behind symptom icons and the ticket number:
/// a circle, a rounded square, a 12-scallop "cookie" and an 8-petal flower.
enum SaxlemShapeKind { circle, squircle, cookie, flower }

class SaxlemShape extends StatelessWidget {
  const SaxlemShape({
    required this.kind,
    required this.color,
    required this.size,
    this.child,
    super.key,
  });
  final SaxlemShapeKind kind;
  final Color color;
  final double size;
  final Widget? child;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: size,
    child: CustomPaint(
      painter: _ShapePainter(kind, color),
      child: child == null ? null : Center(child: child),
    ),
  );
}

class _ShapePainter extends CustomPainter {
  _ShapePainter(this.kind, this.color);
  final SaxlemShapeKind kind;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..isAntiAlias = true;
    final rect = Offset.zero & size;
    switch (kind) {
      case SaxlemShapeKind.circle:
        canvas.drawOval(rect, paint);
      case SaxlemShapeKind.squircle:
        canvas.drawRRect(
          RRect.fromRectAndRadius(rect, Radius.circular(size.width * .3)),
          paint,
        );
      case SaxlemShapeKind.cookie:
        canvas.drawPath(_lobed(size, 12, .085), paint);
      case SaxlemShapeKind.flower:
        canvas.drawPath(_lobed(size, 8, .06), paint);
    }
  }

  static Path _lobed(Size size, int lobes, double depth) {
    final centre = size.center(Offset.zero);
    final radius = size.width / 2;
    final path = Path();
    const steps = 240;
    for (var i = 0; i <= steps; i++) {
      final t = 2 * math.pi * i / steps;
      final r = radius * (1 + depth * math.cos(lobes * t)) / (1 + depth);
      final point = centre + Offset(r * math.cos(t), r * math.sin(t));
      i == 0
          ? path.moveTo(point.dx, point.dy)
          : path.lineTo(point.dx, point.dy);
    }
    return path..close();
  }

  @override
  bool shouldRepaint(_ShapePainter old) =>
      old.kind != kind || old.color != color;
}
