import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/notification_types.dart';
import '../controllers/notifications_controller.dart';
import '../notification_copy.dart';
import '../widgets/notification_card.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';

class NotificationDetailsPage extends StatelessWidget {
  const NotificationDetailsPage({
    required this.group,
    required this.controller,
    this.profilesController,
    super.key,
  });
  final NotificationGroup group;
  final NotificationsController controller;
  final PatientProfilesController? profilesController;
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
            if (profilesController != null) ...[
              PatientSelector(
                controller: profilesController!,
                label: strings.currentPatient,
              ),
              const SizedBox(height: SaxlemSpacing.two),
            ],
            SaxlemCard(
              radius: SaxlemRadii.hero,
              padding: const EdgeInsetsDirectional.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Builder(
                    builder: (context) {
                      final (tint, ink) = notificationCategoryColors(
                        context,
                        item.category,
                      );
                      return Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: tint,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          notificationCategoryIcon(item.category),
                          color: ink,
                          size: 28,
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  Semantics(
                    header: true,
                    child: Text(
                      copy.title,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _Part(
                    icon: Icons.info_outline_rounded,
                    label: strings.whatHappened,
                    value: copy.happened,
                  ),
                  _Part(
                    icon: Icons.help_outline_rounded,
                    label: strings.whyItHappened,
                    value: copy.why,
                  ),
                  _Part(
                    icon: Icons.arrow_circle_right_outlined,
                    label: strings.whatToDoNext,
                    value: copy.next,
                    emphasized: true,
                  ),
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
          ],
        ),
      ),
    );
  }
}

class _Part extends StatelessWidget {
  const _Part({
    required this.icon,
    required this.label,
    required this.value,
    this.emphasized = false,
  });
  final IconData icon;
  final String label, value;
  final bool emphasized;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsetsDirectional.only(bottom: 10),
      padding: const EdgeInsetsDirectional.all(14),
      decoration: BoxDecoration(
        color: emphasized ? colors.brandTint : colors.surfaceSunken,
        borderRadius: BorderRadius.circular(SaxlemRadii.medium),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: emphasized ? colors.brandPrimary : colors.textSecondary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: theme.textTheme.labelMedium),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
