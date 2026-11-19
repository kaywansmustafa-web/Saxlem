import 'package:flutter/material.dart';

import '../../../../design_system/components/content/saxlem_mark.dart';
import '../../../../design_system/theme/saxlem_colors.dart';

class DashboardHeader extends StatelessWidget {
  const DashboardHeader({
    required this.userName,
    required this.greeting,
    required this.notificationLabel,
    this.onNotificationPressed,
    this.unreadCount = 0,
    super.key,
  });

  /// The large line (the patient's first name, or the greeting itself).
  final String userName;

  /// The small line above it; empty to hide.
  final String greeting;
  final String notificationLabel;
  final VoidCallback? onNotificationPressed;

  /// Unread notifications, shown as a badge on the bell.
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SaxlemMark(size: 38, onDark: colors.isDark),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (greeting.isNotEmpty) ...[
                Text(
                  greeting,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.textSecondary,
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
                  style: theme.textTheme.headlineSmall,
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
                boxShadow: colors.cardShadow,
              ),
              child: InkWell(
                onTap: onNotificationPressed,
                customBorder: const CircleBorder(),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      Icon(
                        unreadCount > 0
                            ? Icons.notifications_rounded
                            : Icons.notifications_none_rounded,
                        color: colors.textPrimary,
                      ),
                      if (unreadCount > 0)
                        PositionedDirectional(
                          top: 9,
                          end: 8,
                          child: ExcludeSemantics(
                            child: Container(
                              constraints: const BoxConstraints(
                                minWidth: 18,
                                minHeight: 18,
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 5,
                              ),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: colors.criticalContent,
                                borderRadius: BorderRadius.circular(9),
                                border: Border.all(
                                  color: colors.surfaceRaised,
                                  width: 2,
                                ),
                              ),
                              child: Text(
                                unreadCount > 9 ? '9+' : '$unreadCount',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: colors.onFill,
                                  fontSize: 10,
                                  height: 1.1,
                                  fontWeight: FontWeight.w700,
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
      ],
    );
  }
}
