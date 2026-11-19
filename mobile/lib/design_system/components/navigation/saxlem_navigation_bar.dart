import 'dart:ui';
import 'package:flutter/material.dart';
import '../../foundations/saxlem_elevation.dart';
import '../../foundations/saxlem_motion.dart';
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

/// Design A's floating glass bar: frosted, above the home indicator. Every
/// item keeps its label, so people new to phones always know where a tab
/// goes; the current one sits on a solid blue pill with a soft glow.
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
    const radius = 26.0;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 12),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            boxShadow: [
              BoxShadow(
                color: colors.isDark
                    ? const Color(0x73000000)
                    : const Color(0x24172B78),
                blurRadius: 36,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: colors.glass,
                  borderRadius: BorderRadius.circular(radius),
                  border: Border.all(color: colors.glassBorder),
                ),
                child: Row(
                  children: List.generate(destinations.length, (index) {
                    final item = destinations[index];
                    final selected = index == selectedIndex;
                    final tint = selected ? colors.onFill : colors.textMuted;
                    return Expanded(
                      child: Semantics(
                        button: true,
                        selected: selected,
                        label: item.badgeCount > 0
                            ? '${item.label}, ${item.badgeSemanticLabel ?? item.badgeCount}'
                            : item.label,
                        child: ExcludeSemantics(
                          child: InkWell(
                            onTap: () => onSelected(index),
                            borderRadius: BorderRadius.circular(20),
                            child: AnimatedContainer(
                              duration: SaxlemMotion.standard,
                              curve: SaxlemMotion.standardCurve,
                              constraints: const BoxConstraints(
                                minHeight: SaxlemSizes.minimumTouchTarget + 10,
                              ),
                              decoration: BoxDecoration(
                                color: selected
                                    ? colors.brandFill
                                    : colors.brandFill.withValues(alpha: 0),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: selected
                                    ? SaxlemElevation.glow(colors.brandFill)
                                    : null,
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Badge(
                                    isLabelVisible: item.badgeCount > 0,
                                    label: Text(
                                      item.badgeCount > 99
                                          ? '99+'
                                          : '${item.badgeCount}',
                                    ),
                                    child: Icon(
                                      selected ? item.selectedIcon : item.icon,
                                      size: 22,
                                      color: tint,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Padding(
                                    padding:
                                        const EdgeInsetsDirectional.symmetric(
                                          horizontal: 4,
                                        ),
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        item.label,
                                        maxLines: 1,
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                              color: tint,
                                              fontSize: 12,
                                              fontWeight: selected
                                                  ? FontWeight.w700
                                                  : FontWeight.w500,
                                            ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
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
