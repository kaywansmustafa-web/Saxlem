import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/notification_types.dart';
import '../controllers/notifications_controller.dart';
import '../notification_copy.dart';

class NotificationDetailsPage extends StatelessWidget {
  const NotificationDetailsPage({
    required this.group,
    required this.controller,
    super.key,
  });
  final NotificationGroup group;
  final NotificationsController controller;
  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final item = group.latest;
    final copy = NotificationCopy(strings).forItem(item);
    return Scaffold(
      appBar: AppBar(title: Text(strings.notificationDetails)),
      body: SaxlemResponsiveContent(
        child: ListView(
          padding: const EdgeInsetsDirectional.symmetric(
            vertical: SaxlemSpacing.three,
          ),
          children: [
            SaxlemCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    copy.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: SaxlemSpacing.three),
                  _Part(label: strings.whatHappened, value: copy.happened),
                  _Part(label: strings.whyItHappened, value: copy.why),
                  _Part(label: strings.whatToDoNext, value: copy.next),
                ],
              ),
            ),
            if (group.isGrouped) ...[
              const SizedBox(height: SaxlemSpacing.two),
              Text(
                strings.queueUpdates,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: SaxlemSpacing.one),
              ...group.notifications.reversed.map((entry) {
                final entryCopy = NotificationCopy(strings).forItem(entry);
                return Padding(
                  padding: const EdgeInsetsDirectional.only(
                    bottom: SaxlemSpacing.one,
                  ),
                  child: SaxlemCard(child: Text(entryCopy.happened)),
                );
              }),
            ],
            const SizedBox(height: SaxlemSpacing.three),
            if (item.action.destination != NotificationDestination.none)
              SaxlemButton(
                label: strings.viewUpdate,
                onPressed: () => controller.perform(item.action),
                expand: true,
              ),
            const SizedBox(height: SaxlemSpacing.one),
            if (item.priority != NotificationPriority.critical)
              SaxlemButton(
                label: strings.deleteNotification,
                hierarchy: SaxlemButtonHierarchy.tertiary,
                onPressed: () async {
                  await controller.delete(item.id);
                  if (context.mounted) Navigator.pop(context);
                },
                expand: true,
              ),
          ],
        ),
      ),
    );
  }
}

class _Part extends StatelessWidget {
  const _Part({required this.label, required this.value});
  final String label, value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.only(bottom: SaxlemSpacing.two),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: SaxlemSpacing.half),
        Text(value),
      ],
    ),
  );
}
