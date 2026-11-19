import 'package:flutter/material.dart';
import '../../foundations/saxlem_elevation.dart';
import '../../foundations/saxlem_motion.dart';
import '../../foundations/saxlem_radii.dart';
import '../../theme/saxlem_colors.dart';

enum SaxlemButtonHierarchy { primary, secondary, tertiary }

/// The one action control. `primary` is a filled Saxlem Blue button with a
/// soft top highlight and a coloured glow; `secondary` is outlined; `tertiary`
/// is text-only. Every button presses down slightly when touched.
class SaxlemButton extends StatefulWidget {
  const SaxlemButton({
    required this.label,
    required this.onPressed,
    this.hierarchy = SaxlemButtonHierarchy.primary,
    this.loading = false,
    this.leadingIcon,
    this.trailingIcon,
    this.expand = false,
    this.semanticLabel,
    super.key,
  });
  final String label;
  final VoidCallback? onPressed;
  final SaxlemButtonHierarchy hierarchy;
  final bool loading, expand;
  final IconData? leadingIcon, trailingIcon;
  final String? semanticLabel;

  @override
  State<SaxlemButton> createState() => _SaxlemButtonState();
}

class _SaxlemButtonState extends State<SaxlemButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final callback = widget.loading ? null : widget.onPressed;
    final enabled = callback != null;
    final isPrimary = widget.hierarchy == SaxlemButtonHierarchy.primary;
    final child = AnimatedSwitcher(
      duration: SaxlemMotion.fast,
      child: widget.loading
          ? SizedBox.square(
              key: const ValueKey('loading'),
              dimension: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: isPrimary ? colors.onFill : colors.brandPrimary,
              ),
            )
          : Row(
              key: const ValueKey('label'),
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.leadingIcon != null) ...[
                  Icon(widget.leadingIcon, size: 20),
                  const SizedBox(width: 8),
                ],
                Flexible(child: Text(widget.label)),
                if (widget.trailingIcon != null) ...[
                  const SizedBox(width: 8),
                  Icon(widget.trailingIcon, size: 20),
                ],
              ],
            ),
    );
    final button = switch (widget.hierarchy) {
      SaxlemButtonHierarchy.primary => FilledButton(
        onPressed: callback,
        style: FilledButton.styleFrom(
          backgroundBuilder: (context, states, child) => DecoratedBox(
            decoration: BoxDecoration(
              gradient: states.contains(WidgetState.disabled)
                  ? null
                  : LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.white.withValues(alpha: .16),
                        Colors.white.withValues(alpha: 0),
                      ],
                    ),
            ),
            child: child,
          ),
        ),
        child: child,
      ),
      SaxlemButtonHierarchy.secondary => OutlinedButton(
        onPressed: callback,
        child: child,
      ),
      SaxlemButtonHierarchy.tertiary => TextButton(
        onPressed: callback,
        child: child,
      ),
    };
    final decorated = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(SaxlemRadii.large),
        boxShadow: isPrimary && enabled
            ? SaxlemElevation.glow(colors.brandFill)
            : SaxlemElevation.none,
      ),
      child: button,
    );
    return Semantics(
      button: true,
      label: widget.semanticLabel ?? widget.label,
      child: Listener(
        onPointerDown: enabled ? (_) => setState(() => _pressed = true) : null,
        onPointerUp: (_) => setState(() => _pressed = false),
        onPointerCancel: (_) => setState(() => _pressed = false),
        child: AnimatedScale(
          scale: _pressed ? .97 : 1,
          duration: SaxlemMotion.instant,
          curve: SaxlemMotion.press,
          child: widget.expand
              ? SizedBox(width: double.infinity, child: decorated)
              : decorated,
        ),
      ),
    );
  }
}
