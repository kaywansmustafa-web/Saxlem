import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/notification_types.dart';
import '../notification_copy.dart';

class NotificationCard extends StatelessWidget {
  const NotificationCard({required this.group, required this.onTap, super.key});
  final NotificationGroup group;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final item = group.latest;
    final copy = NotificationCopy(context.l10n).forItem(item);
    return SaxlemCard(
      onTap: onTap,
      semanticLabel: '${copy.title}. ${copy.happened}. ${copy.next}',
      borderColor: item.isUnread ? context.saxlemColors.notification : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(_icon(item.category), color: context.saxlemColors.notification),
          const SizedBox(width: SaxlemSpacing.two),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  copy.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: SaxlemSpacing.half),
                Text(
                  copy.happened,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: SaxlemSpacing.half),
                Text(
                  _relativeTime(context, item.occurredAt),
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                const SizedBox(height: SaxlemSpacing.one),
                Text(copy.next, style: Theme.of(context).textTheme.bodySmall),
                if (group.isGrouped) ...[
                  const SizedBox(height: SaxlemSpacing.one),
                  Text(
                    context.l10n.notificationUpdates(
                      group.notifications.length,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (item.isUnread)
            Semantics(
              label: context.l10n.unread,
              child: Icon(
                Icons.circle,
                size: 10,
                color: context.saxlemColors.notification,
              ),
            ),
        ],
      ),
    );
  }

  IconData _icon(NotificationCategory category) => switch (category) {
    NotificationCategory.queue => Icons.groups_rounded,
    NotificationCategory.appointment => Icons.calendar_month_rounded,
    NotificationCategory.clinic => Icons.local_hospital_rounded,
    NotificationCategory.account => Icons.person_rounded,
    NotificationCategory.system => Icons.info_rounded,
  };

  String _relativeTime(BuildContext context, DateTime occurredAt) {
    final minutes = DateTime.now().difference(occurredAt.toLocal()).inMinutes;
    if (minutes < 2) return context.l10n.notificationTimeJustNow;
    if (minutes < 60) return context.l10n.notificationTimeMinutesAgo(minutes);
    return context.l10n.notificationTimeEarlier;
  }
}
