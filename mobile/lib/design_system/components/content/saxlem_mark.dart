import 'package:flutter/material.dart';

/// The Saxlem mark, drawn in code: two rounded shapes (blue above, aqua below)
/// that meet to form an "S", with a small plus where they touch.
///
/// Brand rule (founder, 2026-11-19): the plus is white when the background
/// behind the logo is dark ([onDark]) and night ink when it is bright.
/// Pass [color] for a one-colour mark; its plus is then cut out, so it shows
/// the background (a white plus on a white mark would disappear).
class SaxlemMark extends StatelessWidget {
  const SaxlemMark({
    this.size = 48,
    this.color,
    this.onDark = false,
    this.semanticLabel,
    super.key,
  });
  final double size;
  final Color? color;
  final bool onDark;
  final String? semanticLabel;

  /// The plus on a bright background.
  static const ink = Color(0xFF0B1533);

  /// The plus on a dark background.
  static const light = Color(0xFFFFFFFF);

  @override
  Widget build(BuildContext context) => Semantics(
    image: semanticLabel != null,
    label: semanticLabel,
    excludeSemantics: true,
    child: SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _MarkPainter(color, onDark ? light : ink)),
    ),
  );
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.color, this.cross);
  final Color? color;
  final Color cross;

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
      ..color = cross
      ..blendMode = color == null ? BlendMode.srcOver : BlendMode.clear
      ..strokeWidth = 19 * s
      ..strokeCap = StrokeCap.round;
    canvas
      ..drawLine(c.translate(0, -30 * s), c.translate(0, 30 * s), plus)
      ..drawLine(c.translate(-30 * s, 0), c.translate(30 * s, 0), plus)
      ..restore();
  }

  @override
  bool shouldRepaint(_MarkPainter old) =>
      old.color != color || old.cross != cross;
}
