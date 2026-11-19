import 'package:flutter/material.dart';

import '../../../../design_system/theme/saxlem_colors.dart';

/// The home search pill: opens Discover. Sits on the hero card.
class DashboardSearchBar extends StatelessWidget {
  const DashboardSearchBar({
    required this.hintText,
    required this.searchSemanticLabel,
    required this.filterSemanticLabel,
    this.onTap,
    this.onFilterPressed,
    super.key,
  });

  final String hintText;
  final String searchSemanticLabel;
  final String filterSemanticLabel;
  final VoidCallback? onTap;
  final VoidCallback? onFilterPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    return Semantics(
      button: true,
      label: searchSemanticLabel,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          boxShadow: colors.cardShadow,
        ),
        child: Material(
          color: colors.surfaceRaised,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: colors.border),
          ),
          shadowColor: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(18),
            child: SizedBox(
              height: 56,
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 8, 0),
                child: Row(
                  children: [
                    Icon(Icons.search_rounded, color: colors.textSecondary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        hintText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Semantics(
                      button: true,
                      label: filterSemanticLabel,
                      child: Material(
                        color: colors.surfaceSunken,
                        borderRadius: BorderRadius.circular(13),
                        child: InkWell(
                          onTap: onFilterPressed,
                          borderRadius: BorderRadius.circular(13),
                          child: SizedBox.square(
                            dimension: 42,
                            child: Icon(
                              Icons.tune_rounded,
                              color: colors.textPrimary,
                              size: 20,
                            ),
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
      ),
    );
  }
}
