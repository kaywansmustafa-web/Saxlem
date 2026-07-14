import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';

class DashboardHeader extends StatelessWidget {
  const DashboardHeader({
    required this.userName,
    required this.greeting,
    required this.notificationLabel,
    this.onNotificationPressed,
    super.key,
  });

  final String userName;
  final String greeting;
  final String notificationLabel;
  final VoidCallback? onNotificationPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: colors.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                userName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: colors.onSurface,
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
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: onNotificationPressed,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Icon(
                  Icons.notifications_none_rounded,
                  color: colors.onSurface,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
