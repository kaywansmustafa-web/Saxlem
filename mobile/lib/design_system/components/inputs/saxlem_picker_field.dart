import 'package:flutter/material.dart';
import '../../foundations/saxlem_radii.dart';
import '../../theme/saxlem_colors.dart';

/// A tappable field that opens a chooser (a list, a date picker). It looks
/// like a text field: small label above the value, trailing icon.
class SaxlemPickerField extends StatelessWidget {
  const SaxlemPickerField({
    required this.label,
    required this.value,
    required this.onTap,
    this.icon = Icons.expand_more_rounded,
    super.key,
  });
  final String label, value;
  final VoidCallback? onTap;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      label: '$label, $value',
      child: Material(
        type: MaterialType.transparency,
        child: Ink(
          decoration: BoxDecoration(
            color: colors.surfaceRaised,
            borderRadius: BorderRadius.circular(SaxlemRadii.large),
            border: Border.all(color: colors.outlineStrong, width: 1.5),
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(SaxlemRadii.large),
            child: ExcludeSemantics(
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 60),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 12, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              label,
                              style: theme.textTheme.labelSmall?.copyWith(
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(value, style: theme.textTheme.bodyLarge),
                          ],
                        ),
                      ),
                      Icon(icon, color: colors.textSecondary),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
