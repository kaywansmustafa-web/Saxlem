import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/actions/saxlem_button.dart';
import '../../../../design_system/components/feedback/saxlem_state_view.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';
import '../../domain/entities/patient_queue_status.dart';
import '../../domain/repositories/live_queue_repository.dart';
import '../controllers/live_queue_controller.dart';
import '../state/live_queue_state.dart';
import '../widgets/live_ticket.dart';

class LiveQueuePage extends StatelessWidget {
  const LiveQueuePage({required this.controller, super.key});
  final LiveQueueController controller;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(context.l10n.liveQueue)),
    body: SafeArea(
      child: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _body(context, controller.state),
        ),
      ),
    ),
  );
  Widget _body(BuildContext context, LiveQueueState state) => switch (state) {
    LiveQueueInitial() || LiveQueueLoading() => Center(
      child: Semantics(
        label: context.l10n.loadingYourLiveQueue,
        child: const CircularProgressIndicator(),
      ),
    ),
    LiveQueueFailed(:final problem) => SaxlemStateView(
      kind: problem == LiveQueueProblem.offline
          ? SaxlemStateKind.offline
          : SaxlemStateKind.error,
      title: context.l10n.liveQueue,
      message: _problem(context, problem),
      actionLabel: context.l10n.reload,
      onAction: controller.load,
    ),
    LiveQueueReady(:final status, :final refreshProblem) => _content(
      context,
      status,
      refreshProblem,
    ),
  };

  Widget _content(
    BuildContext context,
    PatientQueueStatus q,
    LiveQueueProblem? problem,
  ) => RefreshIndicator(
    onRefresh: controller.load,
    child: SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsetsDirectional.fromSTEB(20, 8, 20, 40),
      child: SaxlemResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (problem != null) ...[
              _Banner(
                icon: problem == LiveQueueProblem.offline
                    ? Icons.cloud_off_rounded
                    : Icons.update_rounded,
                title: problem == LiveQueueProblem.offline
                    ? context.l10n.queueOfflineTitle
                    : context.l10n.queueDelayedTitle,
                message: _problem(context, problem),
              ),
              const SizedBox(height: 12),
            ],
            if (q.queueState == QueueState.paused) ...[
              _Banner(
                icon: Icons.pause_circle_rounded,
                title: context.l10n.queuePausedTitle,
                message: context.l10n.queuePausedBody,
              ),
              const SizedBox(height: 12),
            ],
            if (q.queueState == QueueState.closed) ...[
              _Banner(
                icon: Icons.lock_clock_rounded,
                title: context.l10n.queueClosedTitle,
                message: context.l10n.queueClosedBody,
              ),
              const SizedBox(height: 12),
            ],
            LiveTicket(status: q),
            if (q.currentTicketNumber != null &&
                (q.patientEntryStatus == PatientEntryStatus.waiting ||
                    q.patientEntryStatus ==
                        PatientEntryStatus.notEnqueued)) ...[
              const SizedBox(height: 12),
              _NowServing(number: q.currentTicketNumber!),
            ],
            const SizedBox(height: 20),
            SaxlemButton(
              label: context.l10n.reload,
              leadingIcon: Icons.refresh_rounded,
              hierarchy: SaxlemButtonHierarchy.tertiary,
              onPressed: controller.load,
            ),
          ],
        ),
      ),
    ),
  );

  String _problem(BuildContext context, LiveQueueProblem p) => switch (p) {
    LiveQueueProblem.offline => context.l10n.offlineBody,
    LiveQueueProblem.sessionExpired => context.l10n.sessionExpiredBody,
    LiveQueueProblem.notFound => context.l10n.appointmentNotFound,
    LiveQueueProblem.forbidden => context.l10n.appointmentForbidden,
    _ => context.l10n.queueNotReady,
  };
}

class _NowServing extends StatelessWidget {
  const _NowServing({required this.number});
  final int number;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      container: true,
      label: '${context.l10n.currentPatient} $number',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsetsDirectional.symmetric(
            horizontal: 18,
            vertical: 14,
          ),
          decoration: BoxDecoration(
            color: colors.surfaceRaised,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            border: Border.all(color: colors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: colors.brandTint,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.campaign_rounded,
                  size: 20,
                  color: colors.brandPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  context.l10n.currentPatient,
                  style: theme.textTheme.titleSmall,
                ),
              ),
              Text(
                '$number',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({
    required this.icon,
    required this.title,
    required this.message,
  });
  final IconData icon;
  final String title, message;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      liveRegion: true,
      container: true,
      label: '$title. $message',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsetsDirectional.all(14),
          decoration: BoxDecoration(
            color: colors.cautionSurface,
            borderRadius: BorderRadius.circular(SaxlemRadii.medium),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: colors.cautionContent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: colors.cautionContent,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      message,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
