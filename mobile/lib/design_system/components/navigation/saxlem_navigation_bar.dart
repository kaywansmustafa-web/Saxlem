import 'package:flutter/material.dart';
import '../../foundations/saxlem_elevation.dart';
import '../../foundations/saxlem_motion.dart';
import '../../foundations/saxlem_radii.dart';
import '../../foundations/saxlem_sizes.dart';
import '../../foundations/saxlem_spacing.dart';
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
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 12),
        padding: const EdgeInsetsDirectional.all(SaxlemSpacing.one),
        decoration: BoxDecoration(
          color: colors.surfaceElevated,
          borderRadius: BorderRadius.circular(SaxlemRadii.card),
          border: Border.all(color: colors.border),
          boxShadow: SaxlemElevation.level3(Colors.black),
        ),
        child: Row(
          children: List.generate(destinations.length, (index) {
            final item = destinations[index];
            final selected = index == selectedIndex;
            return Expanded(
              child: Semantics(
                button: true,
                selected: selected,
                label: item.badgeCount > 0
                    ? '${item.label}, ${item.badgeSemanticLabel ?? item.badgeCount}'
                    : item.label,
                child: InkWell(
                  onTap: () => onSelected(index),
                  borderRadius: BorderRadius.circular(SaxlemRadii.large),
                  child: AnimatedContainer(
                    duration: SaxlemMotion.standard,
                    constraints: const BoxConstraints(
                      minHeight: SaxlemSizes.minimumTouchTarget,
                    ),
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 4,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: selected
                          ? colors.brandPrimary.withValues(alpha: .1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(SaxlemRadii.large),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Badge(
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
                            size: 24,
                            color: selected
                                ? colors.brandPrimary
                                : colors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: selected
                                    ? colors.brandPrimary
                                    : colors.textMuted,
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
