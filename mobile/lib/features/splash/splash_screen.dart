import 'package:flutter/material.dart';

import '../../design_system/components/content/saxlem_mark.dart';
import '../../design_system/foundations/saxlem_typography.dart';
import '../../design_system/theme/saxlem_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.88,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(gradient: colors.deepAura),
        child: SafeArea(
          child: Center(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SaxlemMark(
                      size: 88,
                      color: colors.onFill,
                      semanticLabel: 'Saxlem',
                    ),
                    const SizedBox(height: 20),
                    ExcludeSemantics(
                      child: Text(
                        'saxlem',
                        style: TextStyle(
                          fontFamily: SaxlemTypography.display,
                          fontSize: 38,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -1.2,
                          color: colors.onFill,
                        ),
                      ),
                    ),
                    ExcludeSemantics(
                      child: Text(
                        'ساخلەم',
                        style: TextStyle(
                          fontFamily: 'Rudaw',
                          fontSize: 26,
                          color: colors.onFill.withValues(alpha: .9),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
