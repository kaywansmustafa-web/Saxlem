import 'package:flutter/material.dart';

import '../../../../design_system/foundations/saxlem_elevation.dart';
import '../../../../design_system/theme/saxlem_colors.dart';

class DashboardHeader extends StatelessWidget {
  const DashboardHeader({
    required this.userName,
    required this.greeting,
    required this.notificationLabel,
    this.onNotificationPressed,
    super.key,
  });

  /// The large line (the patient's first name, or the greeting itself).
  final String userName;

  /// The small line above it; empty to hide.
  final String greeting;
  final String notificationLabel;
  final VoidCallback? onNotificationPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (greeting.isNotEmpty) ...[
                Text(
                  greeting,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: colors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
              ],
              Semantics(
                header: true,
                child: Text(
                  userName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.headlineMedium,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Semantics(
          button: true,
          label: notificationLabel,
          child: Material(
            type: MaterialType.transparency,
            child: Ink(
              decoration: BoxDecoration(
                color: colors.surfaceRaised,
                shape: BoxShape.circle,
                border: Border.all(color: colors.border),
                boxShadow: SaxlemElevation.level1(colors.night),
              ),
              child: InkWell(
                onTap: onNotificationPressed,
                customBorder: const CircleBorder(),
                child: SizedBox(
                  width: 52,
                  height: 52,
                  child: Icon(
                    Icons.notifications_none_rounded,
                    color: colors.textPrimary,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
