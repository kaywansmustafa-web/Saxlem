import 'dart:math' as math;
import 'package:flutter/material.dart';

import '../../design_system/foundations/saxlem_typography.dart';
import '../../design_system/theme/saxlem_colors.dart';

/// Animated launch screen.
///
/// The two halves of the Saxlem mark fly in and lock together, the small plus
/// beats once like a pulse, the wordmark types in, and the screen then idles
/// with a slow breathing shine while the app finishes loading. With reduced
/// motion it shows the finished logo at once.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  /// Length of the intro; the app keeps the splash at least this long.
  static const introDuration = Duration(milliseconds: 1900);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: SplashScreen.introDuration,
  );
  late final AnimationController _idle = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3200),
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _intro.value = 1;
    } else {
      _intro.forward().whenComplete(() {
        if (mounted) _idle.repeat();
      });
    }
  }

  @override
  void dispose() {
    _intro.dispose();
    _idle.dispose();
    super.dispose();
  }

  /// Maps the intro progress into a sub-interval, with a curve.
  double _phase(double begin, double end, [Curve curve = Curves.easeOutCubic]) {
    final t = ((_intro.value - begin) / (end - begin)).clamp(0.0, 1.0);
    return curve.transform(t);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Scaffold(
      backgroundColor: colors.night,
      body: Semantics(
        label: 'Saxlem',
        image: true,
        child: AnimatedBuilder(
          animation: Listenable.merge([_intro, _idle]),
          builder: (context, _) {
            final background = _phase(0, .3);
            final assemble = _phase(.08, .52, Curves.easeOutBack);
            final settle = _phase(.08, .52);
            final pulse = _phase(.46, .78, Curves.easeOut);
            final idle = _idle.value;
            final breathe = 1 + .025 * math.sin(idle * 2 * math.pi);
            return Stack(
              fit: StackFit.expand,
              children: [
                // Drifting aura glows.
                CustomPaint(
                  painter: _AuraBackdropPainter(
                    reveal: background,
                    drift: idle,
                    blue: colors.auraStart,
                    teal: colors.auraEnd,
                  ),
                ),
                // Techy dot grid, revealed from the centre.
                CustomPaint(
                  painter: _DotGridPainter(
                    reveal: background,
                    color: colors.onFill,
                  ),
                ),
                SafeArea(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 200,
                          height: 200,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Heartbeat ring from the plus.
                              if (pulse > 0 && pulse < 1)
                                Opacity(
                                  opacity: (1 - pulse) * .7,
                                  child: Container(
                                    width: 40 + 140 * pulse,
                                    height: 40 + 140 * pulse,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: colors.auraEnd,
                                        width: 2,
                                      ),
                                    ),
                                  ),
                                ),
                              // Soft halo behind the mark.
                              Opacity(
                                opacity: settle,
                                child: Container(
                                  width: 200,
                                  height: 200,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: RadialGradient(
                                      colors: [
                                        colors.auraStart.withValues(alpha: .38),
                                        colors.auraEnd.withValues(alpha: .10),
                                        colors.auraEnd.withValues(alpha: 0),
                                      ],
                                      stops: const [0, .45, 1],
                                    ),
                                  ),
                                ),
                              ),
                              Transform.scale(
                                scale: breathe,
                                child: CustomPaint(
                                  size: const Size.square(120),
                                  painter: _AssemblingMarkPainter(
                                    assemble: assemble,
                                    opacity: settle,
                                    plus: _phase(.42, .62, Curves.elasticOut),
                                    shine: _intro.isCompleted ? idle : -1,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 22),
                        _Wordmark(
                          progress: _phase(.5, .9),
                          color: colors.onFill,
                        ),
                        const SizedBox(height: 6),
                        Opacity(
                          opacity: _phase(.72, 1),
                          child: Transform.translate(
                            offset: Offset(0, 8 * (1 - _phase(.72, 1))),
                            child: Text(
                              'ساخلەم',
                              textDirection: TextDirection.rtl,
                              style: TextStyle(
                                fontFamily: 'Rudaw',
                                fontSize: 24,
                                color: colors.onFill.withValues(alpha: .82),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Slim loading shimmer once the intro is done.
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 56 + MediaQuery.paddingOf(context).bottom,
                  child: Center(
                    child: Opacity(
                      opacity: _phase(.85, 1),
                      child: _LoadingTrack(
                        progress: idle,
                        start: colors.auraStart,
                        end: colors.auraEnd,
                        track: colors.onFill.withValues(alpha: .12),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// "saxlem" typed in letter by letter.
class _Wordmark extends StatelessWidget {
  const _Wordmark({required this.progress, required this.color});
  final double progress;
  final Color color;
  static const _word = 'saxlem';

  @override
  Widget build(BuildContext context) {
    final letters = _word.split('');
    return ExcludeSemantics(
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < letters.length; i++)
              Builder(
                builder: (context) {
                  final start = i / (letters.length + 2);
                  final t = ((progress - start) * 3).clamp(0.0, 1.0);
                  final eased = Curves.easeOutCubic.transform(t);
                  return Opacity(
                    opacity: eased,
                    child: Transform.translate(
                      offset: Offset(0, 14 * (1 - eased)),
                      child: Text(
                        letters[i],
                        style: TextStyle(
                          fontFamily: SaxlemTypography.display,
                          fontSize: 40,
                          height: 1.1,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -1.2,
                          color: color,
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _LoadingTrack extends StatelessWidget {
  const _LoadingTrack({
    required this.progress,
    required this.start,
    required this.end,
    required this.track,
  });
  final double progress;
  final Color start, end, track;
  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(99),
    child: SizedBox(
      width: 120,
      height: 3,
      child: CustomPaint(painter: _TrackPainter(progress, start, end, track)),
    ),
  );
}

class _TrackPainter extends CustomPainter {
  _TrackPainter(this.progress, this.start, this.end, this.track);
  final double progress;
  final Color start, end, track;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = track);
    final width = size.width * .4;
    final x = -width + (size.width + width) * progress;
    final rect = Rect.fromLTWH(x, 0, width, size.height);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = LinearGradient(
          colors: [start.withValues(alpha: 0), start, end],
        ).createShader(rect),
    );
  }

  @override
  bool shouldRepaint(_TrackPainter old) => old.progress != progress;
}

class _AuraBackdropPainter extends CustomPainter {
  _AuraBackdropPainter({
    required this.reveal,
    required this.drift,
    required this.blue,
    required this.teal,
  });
  final double reveal, drift;
  final Color blue, teal;

  @override
  void paint(Canvas canvas, Size size) {
    final a = drift * 2 * math.pi;
    void glow(Offset centre, double radius, Color color, double alpha) {
      final rect = Rect.fromCircle(center: centre, radius: radius);
      canvas.drawCircle(
        centre,
        radius,
        Paint()
          ..shader = RadialGradient(
            colors: [
              color.withValues(alpha: alpha * reveal),
              color.withValues(alpha: 0),
            ],
          ).createShader(rect),
      );
    }

    final w = size.width, h = size.height;
    glow(
      Offset(w * (.18 + .05 * math.sin(a)), h * (.22 + .03 * math.cos(a))),
      w * .9,
      blue,
      .42,
    );
    glow(
      Offset(w * (.86 + .05 * math.cos(a)), h * (.82 + .03 * math.sin(a))),
      w * .95,
      teal,
      .34,
    );
  }

  @override
  bool shouldRepaint(_AuraBackdropPainter old) =>
      old.reveal != reveal || old.drift != drift;
}

class _DotGridPainter extends CustomPainter {
  _DotGridPainter({required this.reveal, required this.color});
  final double reveal;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (reveal <= 0) return;
    const gap = 22.0;
    final centre = size.center(Offset.zero);
    final maxDistance = size.longestSide * .75;
    final reach = maxDistance * reveal;
    final paint = Paint();
    for (var y = gap / 2; y < size.height; y += gap) {
      for (var x = gap / 2; x < size.width; x += gap) {
        final d = (Offset(x, y) - centre).distance;
        if (d > reach) continue;
        // Brightest near the reveal front, faint elsewhere and at the edges.
        final front = (1 - ((reach - d) / 80).clamp(0.0, 1.0)) * .14;
        final base = .10 * (1 - d / maxDistance);
        paint.color = color.withValues(alpha: (base + front).clamp(0, .24));
        canvas.drawCircle(Offset(x, y), 1, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DotGridPainter old) => old.reveal != reveal;
}

/// The Saxlem mark drawn in two halves that slide together, with the plus
/// cut out where they meet and an optional diagonal shine.
class _AssemblingMarkPainter extends CustomPainter {
  _AssemblingMarkPainter({
    required this.assemble,
    required this.opacity,
    required this.plus,
    required this.shine,
  });
  final double assemble, opacity, plus;

  /// 0..1 position of the shine sweep, or negative for none.
  final double shine;

  static const _top = [168.0, 80.0, 432.0, 256.0];
  static const _bottom = [80.0, 256.0, 344.0, 432.0];

  @override
  void paint(Canvas canvas, Size size) {
    if (opacity <= 0) return;
    final s = size.width / 352;
    Rect r(List<double> b) => Rect.fromLTRB(
      (b[0] - 80) * s,
      (b[1] - 80) * s,
      (b[2] - 80) * s,
      (b[3] - 80) * s,
    );
    final big = Radius.circular(88 * s), small = Radius.circular(48 * s);
    final away = 1 - assemble;
    final topShift = Offset(70 * s * away, -90 * s * away);
    final bottomShift = Offset(-70 * s * away, 90 * s * away);
    final top = RRect.fromRectAndCorners(
      r(_top).shift(topShift),
      topLeft: big,
      topRight: small,
      bottomRight: big,
    );
    final bottom = RRect.fromRectAndCorners(
      r(_bottom).shift(bottomShift),
      topLeft: big,
      bottomLeft: small,
      bottomRight: big,
    );
    final bounds = (Offset.zero & size).inflate(size.width);
    canvas.saveLayer(
      bounds,
      Paint()..color = Color.fromRGBO(0, 0, 0, opacity.clamp(0, 1)),
    );
    Paint fill(Rect rect, Color a, Color b) => Paint()
      ..shader = LinearGradient(
        colors: [a, b],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(rect);
    canvas.drawRRect(
      top,
      fill(top.outerRect, const Color(0xFF3B6BFF), const Color(0xFF2148F0)),
    );
    canvas.drawRRect(
      bottom,
      fill(bottom.outerRect, const Color(0xFF14C9C4), const Color(0xFF13B0EA)),
    );
    if (plus > 0) {
      final c = Offset(176 * s, 176 * s);
      final arm = 30 * s * plus;
      final cut = Paint()
        ..blendMode = BlendMode.clear
        ..strokeWidth = 19 * s * plus.clamp(0, 1.2)
        ..strokeCap = StrokeCap.round;
      canvas
        ..drawLine(c.translate(0, -arm), c.translate(0, arm), cut)
        ..drawLine(c.translate(-arm, 0), c.translate(arm, 0), cut);
    }
    if (shine >= 0) {
      // A soft light band sweeping across, drawn only on the mark.
      final x = -size.width + size.width * 3 * shine;
      final band = Rect.fromLTWH(x, 0, size.width * .5, size.height);
      canvas.drawRect(
        Offset.zero & size,
        Paint()
          ..blendMode = BlendMode.srcATop
          ..shader = LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withValues(alpha: 0),
              Colors.white.withValues(alpha: .28),
              Colors.white.withValues(alpha: 0),
            ],
          ).createShader(band),
      );
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_AssemblingMarkPainter old) =>
      old.assemble != assemble ||
      old.opacity != opacity ||
      old.plus != plus ||
      old.shine != shine;
}
