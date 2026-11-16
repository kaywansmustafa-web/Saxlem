import 'package:flutter/material.dart';

/// The Saxlem mark, drawn in code: two rounded shapes (blue above, aqua below)
/// that meet to form an "S", with a small plus cut out where they touch.
/// Pass [color] for a one-colour mark (for example white on a gradient).
class SaxlemMark extends StatelessWidget {
  const SaxlemMark({this.size = 48, this.color, this.semanticLabel, super.key});
  final double size;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) => Semantics(
    image: semanticLabel != null,
    label: semanticLabel,
    excludeSemantics: true,
    child: SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _MarkPainter(color)),
    ),
  );
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.color);
  final Color? color;

  // Geometry on the logo's 512 grid; the mark occupies 80..432.
  static const _top = [168.0, 80.0, 432.0, 256.0];
  static const _bottom = [80.0, 256.0, 344.0, 432.0];

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 352;
    Rect r(List<double> b) => Rect.fromLTRB(
      (b[0] - 80) * s,
      (b[1] - 80) * s,
      (b[2] - 80) * s,
      (b[3] - 80) * s,
    );
    final big = Radius.circular(88 * s), small = Radius.circular(48 * s);
    final top = RRect.fromRectAndCorners(
      r(_top),
      topLeft: big,
      topRight: small,
      bottomRight: big,
    );
    final bottom = RRect.fromRectAndCorners(
      r(_bottom),
      topLeft: big,
      bottomLeft: small,
      bottomRight: big,
    );
    canvas.saveLayer(Offset.zero & size, Paint());
    Paint fill(Rect rect, Color a, Color b) => Paint()
      ..color = color ?? a
      ..shader = color == null
          ? LinearGradient(
              colors: [a, b],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(rect)
          : null;
    canvas.drawRRect(
      top,
      fill(top.outerRect, const Color(0xFF3B6BFF), const Color(0xFF2148F0)),
    );
    canvas.drawRRect(
      bottom,
      fill(bottom.outerRect, const Color(0xFF14C9C4), const Color(0xFF13B0EA)),
    );
    final c = Offset(176 * s, 176 * s);
    final plus = Paint()
      ..blendMode = BlendMode.clear
      ..strokeWidth = 19 * s
      ..strokeCap = StrokeCap.round;
    canvas
      ..drawLine(c.translate(0, -30 * s), c.translate(0, 30 * s), plus)
      ..drawLine(c.translate(-30 * s, 0), c.translate(30 * s, 0), plus)
      ..restore();
  }

  @override
  bool shouldRepaint(_MarkPainter old) => old.color != color;
}
