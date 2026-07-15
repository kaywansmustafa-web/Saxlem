import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../controllers/notifications_controller.dart';
import '../state/notifications_state.dart';
import '../widgets/notification_card.dart';
import 'notification_details_page.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({
    required this.controller,
    this.profilesController,
    super.key,
  });
  final NotificationsController controller;
  final PatientProfilesController? profilesController;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => switch (controller.state) {
      NotificationsLoading() => const Center(
        child: CircularProgressIndicator(),
      ),
      NotificationsFailure() => SaxlemStateView(
        kind: SaxlemStateKind.error,
        title: context.l10n.notificationsUnavailable,
        message: context.l10n.notificationsUnavailableBody,
        actionLabel: context.l10n.tryAgain,
        onAction: controller.load,
      ),
      NotificationsReady state => _Ready(
        controller: controller,
        state: state,
        profilesController: profilesController,
      ),
    },
  );
}

class _Ready extends StatelessWidget {
  const _Ready({
    required this.controller,
    required this.state,
    this.profilesController,
  });
  final NotificationsController controller;
  final NotificationsReady state;
  final PatientProfilesController? profilesController;
  @override
  Widget build(BuildContext context) {
    if (state.groups.isEmpty) {
      return SaxlemStateView(
        kind: SaxlemStateKind.empty,
        title: context.l10n.notificationsEmpty,
        message: context.l10n.notificationsEmptyBody,
        icon: Icons.notifications_none_rounded,
      );
    }
    final now = controller.now();
    final unread = state.groups.where((g) => g.unreadCount > 0).toList();
    final today = state.groups
        .where(
          (g) =>
              g.unreadCount == 0 &&
              _sameDay(g.latest.occurredAt.toLocal(), now),
        )
        .toList();
    final earlier = state.groups
        .where(
          (g) =>
              g.unreadCount == 0 &&
              !_sameDay(g.latest.occurredAt.toLocal(), now),
        )
        .toList();
    return SaxlemResponsiveContent(
      child: ListView(
        padding: const EdgeInsetsDirectional.symmetric(
          vertical: SaxlemSpacing.three,
        ),
        children: [
          Text(
            context.l10n.notifications,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          if (profilesController != null) ...[
            const SizedBox(height: SaxlemSpacing.two),
            PatientSelector(
              controller: profilesController!,
              label: context.l10n.currentPatient,
            ),
          ],
          const SizedBox(height: SaxlemSpacing.half),
          Text(context.l10n.unreadNotifications(state.unreadCount)),
          ..._section(context, context.l10n.unread, unread),
          ..._section(context, context.l10n.today, today),
          ..._section(context, context.l10n.earlier, earlier),
        ],
      ),
    );
  }

  List<Widget> _section(
    BuildContext context,
    String title,
    List<NotificationGroup> groups,
  ) {
    if (groups.isEmpty) return const [];
    return [
      const SizedBox(height: SaxlemSpacing.three),
      Text(title, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: SaxlemSpacing.one),
      ...groups.map(
        (group) => Padding(
          padding: const EdgeInsetsDirectional.only(bottom: SaxlemSpacing.one),
          child: NotificationCard(
            group: group,
            onTap: () async {
              await controller.open(group.latest);
              if (!context.mounted) return;
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => NotificationDetailsPage(
                    group: group,
                    controller: controller,
                    profilesController: profilesController,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    ];
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}
