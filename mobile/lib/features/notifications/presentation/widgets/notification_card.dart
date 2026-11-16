import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/notification_types.dart';
import '../notification_copy.dart';

/// One notification (v2 "Aura"): a category icon, the title with its time,
/// what happened and the next step. Unread items carry a dot and a faint blue
/// wash; read ones are plain.
class NotificationCard extends StatelessWidget {
  const NotificationCard({required this.group, required this.onTap, super.key});
  final NotificationGroup group;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final item = group.latest;
    final copy = NotificationCopy(context.l10n).forItem(item);
    final unread = item.isUnread;
    final (tint, ink) = notificationCategoryColors(context, item.category);
    return Semantics(
      button: true,
      label:
          '${unread ? '${context.l10n.unread}. ' : ''}${copy.title}. ${copy.happened}. ${copy.next}',
      child: Material(
        type: MaterialType.transparency,
        child: Ink(
          decoration: BoxDecoration(
            color: unread ? const Color(0xFFF7F9FF) : colors.surfaceRaised,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            border: Border.all(
              color: unread
                  ? colors.brandPrimary.withValues(alpha: .18)
                  : colors.border,
            ),
            boxShadow: SaxlemElevation.level1(colors.night),
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            child: Padding(
              padding: const EdgeInsetsDirectional.all(16),
              child: ExcludeSemantics(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: tint,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        notificationCategoryIcon(item.category),
                        size: 22,
                        color: ink,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  copy.title,
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: unread
                                        ? FontWeight.w700
                                        : FontWeight.w600,
                                  ),
                                ),
                              ),
                              if (unread) ...[
                                const SizedBox(width: 6),
                                Container(
                                  width: 8,
                                  height: 8,
                                  margin: const EdgeInsetsDirectional.only(
                                    top: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: colors.brandPrimary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          Text(
                            _relativeTime(context, item.occurredAt),
                            style: theme.textTheme.labelSmall?.copyWith(
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            copy.happened,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsetsDirectional.only(
                                  top: 2,
                                ),
                                child: Icon(
                                  Directionality.of(context) ==
                                          TextDirection.rtl
                                      ? Icons.subdirectory_arrow_left_rounded
                                      : Icons.subdirectory_arrow_right_rounded,
                                  size: 16,
                                  color: colors.brandPrimary,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  copy.next,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: colors.textPrimary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (group.isGrouped) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsetsDirectional.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: colors.surfaceSunken,
                                borderRadius: BorderRadius.circular(
                                  SaxlemRadii.full,
                                ),
                              ),
                              child: Text(
                                context.l10n.notificationUpdates(
                                  group.notifications.length,
                                ),
                                style: theme.textTheme.labelSmall,
                              ),
                            ),
                          ],
                        ],
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

  String _relativeTime(BuildContext context, DateTime occurredAt) {
    final minutes = DateTime.now().difference(occurredAt.toLocal()).inMinutes;
    if (minutes < 2) return context.l10n.notificationTimeJustNow;
    if (minutes < 60) return context.l10n.notificationTimeMinutesAgo(minutes);
    return context.l10n.notificationTimeEarlier;
  }
}

IconData notificationCategoryIcon(NotificationCategory category) =>
    switch (category) {
      NotificationCategory.queue => Icons.campaign_rounded,
      NotificationCategory.appointment => Icons.event_available_rounded,
      NotificationCategory.clinic => Icons.local_hospital_rounded,
      NotificationCategory.account => Icons.person_rounded,
      NotificationCategory.system => Icons.info_rounded,
    };

(Color, Color) notificationCategoryColors(
  BuildContext context,
  NotificationCategory category,
) {
  final c = context.saxlemColors;
  return switch (category) {
    NotificationCategory.queue => (c.brandTint, c.brandPrimary),
    NotificationCategory.appointment => (c.positiveSurface, c.positiveContent),
    NotificationCategory.clinic => (
      c.auraEnd.withValues(alpha: .16),
      c.tealFill,
    ),
    NotificationCategory.account => (
      c.auraEnd.withValues(alpha: .16),
      c.tealFill,
    ),
    NotificationCategory.system => (c.surfaceSunken, c.textSecondary),
  };
}
