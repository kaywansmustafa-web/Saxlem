import 'package:flutter/material.dart';

import '../../../../design_system/foundations/saxlem_radii.dart';
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
      child: Material(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.full),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(SaxlemRadii.full),
          child: SizedBox(
            height: 56,
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(18, 0, 6, 0),
              child: Row(
                children: [
                  Icon(Icons.search_rounded, color: colors.brandPrimary),
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
                      color: colors.brandPrimary,
                      shape: const CircleBorder(),
                      child: InkWell(
                        onTap: onFilterPressed,
                        customBorder: const CircleBorder(),
                        child: SizedBox.square(
                          dimension: 44,
                          child: Icon(
                            Icons.tune_rounded,
                            color: colors.onFill,
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
    );
  }
}
