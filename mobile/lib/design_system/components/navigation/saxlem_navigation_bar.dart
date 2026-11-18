import 'dart:ui';
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

/// Floating glass navigation (v3 "clarity"): a frosted bar above the home
/// indicator. Every item keeps its label, so people new to phones always know
/// where a tab goes; the current item lights up in Saxlem Blue with a small
/// aura bar beneath it.
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
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(14, 0, 14, 10),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(SaxlemRadii.hero),
            boxShadow: SaxlemElevation.level1(colors.night),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(SaxlemRadii.hero),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
              child: Container(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 4,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: colors.surfaceElevated.withValues(alpha: .96),
                  borderRadius: BorderRadius.circular(SaxlemRadii.hero),
                  border: Border.all(color: colors.border),
                ),
                child: Row(
                  children: List.generate(destinations.length, (index) {
                    final item = destinations[index];
                    final selected = index == selectedIndex;
                    final tint = selected
                        ? colors.brandPrimary
                        : colors.textMuted;
                    return Expanded(
                      child: Semantics(
                        button: true,
                        selected: selected,
                        label: item.badgeCount > 0
                            ? '${item.label}, ${item.badgeSemanticLabel ?? item.badgeCount}'
                            : item.label,
                        child: InkWell(
                          onTap: () => onSelected(index),
                          borderRadius: BorderRadius.circular(
                            SaxlemRadii.extraLarge,
                          ),
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(
                              minHeight: SaxlemSizes.minimumTouchTarget + 10,
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                AnimatedScale(
                                  duration: SaxlemMotion.standard,
                                  curve: SaxlemMotion.standardCurve,
                                  scale: selected ? 1.08 : 1,
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
                                      size: 24,
                                      color: tint,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Padding(
                                  padding:
                                      const EdgeInsetsDirectional.symmetric(
                                        horizontal: 2,
                                      ),
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      item.label,
                                      maxLines: 1,
                                      style: theme.textTheme.labelSmall
                                          ?.copyWith(
                                            color: tint,
                                            fontWeight: selected
                                                ? FontWeight.w700
                                                : FontWeight.w600,
                                          ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                AnimatedContainer(
                                  duration: SaxlemMotion.standard,
                                  curve: SaxlemMotion.standardCurve,
                                  width: selected ? 18 : 0,
                                  height: 3,
                                  decoration: BoxDecoration(
                                    gradient: colors.aura,
                                    borderRadius: BorderRadius.circular(
                                      SaxlemRadii.full,
                                    ),
                                    boxShadow: selected
                                        ? SaxlemElevation.glow(
                                            colors.brandPrimary,
                                          )
                                        : null,
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
            ),
          ),
        ),
      ),
    );
  }
}
