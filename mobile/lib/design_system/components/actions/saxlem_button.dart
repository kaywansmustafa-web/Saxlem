import 'package:flutter/material.dart';
import '../../foundations/saxlem_radii.dart';
import '../../foundations/saxlem_sizes.dart';

enum SaxlemButtonHierarchy { primary, secondary, tertiary }

class SaxlemButton extends StatelessWidget {
  const SaxlemButton({
    required this.label,
    required this.onPressed,
    this.hierarchy = SaxlemButtonHierarchy.primary,
    this.loading = false,
    this.leadingIcon,
    this.expand = false,
    this.semanticLabel,
    super.key,
  });
  final String label;
  final VoidCallback? onPressed;
  final SaxlemButtonHierarchy hierarchy;
  final bool loading, expand;
  final IconData? leadingIcon;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final callback = loading ? null : onPressed;
    final child = AnimatedSwitcher(
      duration: const Duration(milliseconds: 160),
      child: loading
          ? const SizedBox.square(
              key: ValueKey('loading'),
              dimension: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Row(
              key: const ValueKey('label'),
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (leadingIcon != null) ...[
                  Icon(leadingIcon, size: 20),
                  const SizedBox(width: 8),
                ],
                Flexible(child: Text(label)),
              ],
            ),
    );
    final style = ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(
        Size(0, SaxlemSizes.minimumTouchTarget),
      ),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(SaxlemRadii.large),
        ),
      ),
    );
    final button = switch (hierarchy) {
      SaxlemButtonHierarchy.primary => FilledButton(
        onPressed: callback,
        style: style,
        child: child,
      ),
      SaxlemButtonHierarchy.secondary => OutlinedButton(
        onPressed: callback,
        style: style,
        child: child,
      ),
      SaxlemButtonHierarchy.tertiary => TextButton(
        onPressed: callback,
        style: style,
        child: child,
      ),
    };
    return Semantics(
      button: true,
      label: semanticLabel ?? label,
      child: expand ? SizedBox(width: double.infinity, child: button) : button,
    );
  }
}
