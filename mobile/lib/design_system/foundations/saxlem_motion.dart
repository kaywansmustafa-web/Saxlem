import 'package:flutter/animation.dart';

abstract final class SaxlemMotion {
  static const instant = Duration(milliseconds: 100);
  static const fast = Duration(milliseconds: 160);
  static const standard = Duration(milliseconds: 220);
  static const slow = Duration(milliseconds: 280);
  static const page = Duration(milliseconds: 300);
  static const celebration = Duration(milliseconds: 600);

  static const Curve standardCurve = Curves.easeOutCubic;
  static const Curve enter = Curves.easeOutCubic;
  static const Curve exit = Curves.easeInCubic;
  static const Curve emphasized = Curves.easeInOutCubic;
  static const Curve press = Curves.easeOut;
}
