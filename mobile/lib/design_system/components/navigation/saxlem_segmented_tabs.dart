import 'package:flutter/material.dart';
import '../../foundations/saxlem_motion.dart';
import '../../foundations/saxlem_radii.dart';
import '../../theme/saxlem_colors.dart';

/// Pill-shaped tabs on a sunken track (v2 "Aura"). The selected tab lifts onto
/// a white pill. Each tab is a full-height touch target and announces its
/// selected state.
class SaxlemSegmentedTabs<T> extends StatelessWidget {
  const SaxlemSegmentedTabs({
    required this.values,
    required this.selected,
    required this.labelOf,
    required this.onChanged,
    super.key,
  });
  final List<T> values;
  final T selected;
  final String Function(T value) labelOf;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsetsDirectional.all(4),
      decoration: BoxDecoration(
        color: colors.surfaceSunken,
        borderRadius: BorderRadius.circular(SaxlemRadii.full),
      ),
      child: Row(
        children: [
          for (final value in values)
            Expanded(
              child: Semantics(
                button: true,
                selected: value == selected,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onChanged(value),
                  child: AnimatedContainer(
                    duration: SaxlemMotion.standard,
                    curve: SaxlemMotion.standardCurve,
                    constraints: const BoxConstraints(minHeight: 44),
                    alignment: Alignment.center,
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 8,
                    ),
                    decoration: BoxDecoration(
                      color: value == selected
                          ? colors.surfaceRaised
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(SaxlemRadii.full),
                      boxShadow: value == selected ? colors.cardShadow : null,
                    ),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        labelOf(value),
                        maxLines: 1,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: value == selected
                              ? colors.textPrimary
                              : colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
