import 'package:flutter/material.dart';
import '../../foundations/saxlem_elevation.dart';
import '../../foundations/saxlem_motion.dart';
import '../../foundations/saxlem_radii.dart';
import '../../foundations/saxlem_sizes.dart';
import '../../theme/saxlem_colors.dart';

class SaxlemNavigationDestination {
  const SaxlemNavigationDestination({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    this.badgeCount = 0,
    this.badgeSemanticLabel,
  });
  final String label;
  final IconData icon, selectedIcon;
  final int badgeCount;
  final String? badgeSemanticLabel;
}

/// Floating bottom navigation (v2 "Aura"): a rounded bar above the home
/// indicator. Every item keeps its label, so people new to phones always know
/// where a tab goes; the current item's icon sits in a Saxlem Blue pill.
class SaxlemNavigationBar extends StatelessWidget {
  const SaxlemNavigationBar({
    required this.destinations,
    required this.selectedIndex,
    required this.onSelected,
    super.key,
  });
  final List<SaxlemNavigationDestination> destinations;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsetsDirectional.fromSTEB(12, 0, 12, 10),
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 4,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: colors.surfaceElevated,
          borderRadius: BorderRadius.circular(SaxlemRadii.hero),
          border: Border.all(color: colors.border),
          boxShadow: SaxlemElevation.level2(colors.night),
        ),
        child: Row(
          children: List.generate(destinations.length, (index) {
            final item = destinations[index];
            final selected = index == selectedIndex;
            final tint = selected ? colors.brandPrimary : colors.textMuted;
            return Expanded(
              child: Semantics(
                button: true,
                selected: selected,
                label: item.badgeCount > 0
                    ? '${item.label}, ${item.badgeSemanticLabel ?? item.badgeCount}'
                    : item.label,
                child: InkWell(
                  onTap: () => onSelected(index),
                  borderRadius: BorderRadius.circular(SaxlemRadii.extraLarge),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                      minHeight: SaxlemSizes.minimumTouchTarget + 8,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: SaxlemMotion.standard,
                          curve: SaxlemMotion.standardCurve,
                          width: selected ? 52 : 40,
                          height: 32,
                          decoration: BoxDecoration(
                            color: selected
                                ? colors.brandPrimary
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(
                              SaxlemRadii.full,
                            ),
                            boxShadow: selected
                                ? SaxlemElevation.glow(colors.brandPrimary)
                                : null,
                          ),
                          child: Center(
                            child: Badge(
                              isLabelVisible: item.badgeCount > 0,
                              label: AnimatedSwitcher(
                                duration: SaxlemMotion.fast,
                                child: Text(
                                  item.badgeCount > 99
                                      ? '99+'
                                      : '${item.badgeCount}',
                                  key: ValueKey(item.badgeCount),
                                ),
                              ),
                              child: Icon(
                                selected ? item.selectedIcon : item.icon,
                                size: 22,
                                color: selected ? colors.onFill : tint,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Padding(
                          padding: const EdgeInsetsDirectional.symmetric(
                            horizontal: 2,
                          ),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              item.label,
                              maxLines: 1,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: tint,
                                fontWeight: selected
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
