import 'package:flutter/material.dart';
import '../../foundations/saxlem_sizes.dart';
import '../../foundations/saxlem_spacing.dart';

class SaxlemResponsiveContent extends StatelessWidget {
  const SaxlemResponsiveContent({
    required this.child,
    this.maxWidth = SaxlemSizes.readableMaxWidth,
    this.padding = const EdgeInsetsDirectional.symmetric(
      horizontal: SaxlemSpacing.three,
    ),
    super.key,
  });
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) => Align(
    alignment: AlignmentDirectional.topCenter,
    child: ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: Padding(padding: padding, child: child),
    ),
  );
}
