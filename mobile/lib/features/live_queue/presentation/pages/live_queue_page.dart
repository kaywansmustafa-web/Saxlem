import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../domain/entities/patient_queue_status.dart';
import '../../domain/repositories/live_queue_repository.dart';
import '../controllers/live_queue_controller.dart';
import '../state/live_queue_state.dart';

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
    LiveQueueInitial() ||
    LiveQueueLoading() => const Center(child: CircularProgressIndicator()),
    LiveQueueFailed(:final problem) => _failure(context, problem),
    LiveQueueReady(:final status, :final refreshProblem) => _content(
      context,
      status,
      refreshProblem,
    ),
  };
  Widget _failure(BuildContext context, LiveQueueProblem problem) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Semantics(liveRegion: true, child: Text(_problem(context, problem))),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: controller.load,
            child: Text(context.l10n.reload),
          ),
        ],
      ),
    ),
  );
  Widget _content(
    BuildContext context,
    PatientQueueStatus q,
    LiveQueueProblem? problem,
  ) => RefreshIndicator(
    onRefresh: controller.load,
    child: SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsetsDirectional.fromSTEB(24, 24, 24, 40),
      child: SaxlemResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(
              header: true,
              child: Text(
                q.doctor.name,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            Text(q.clinic.name),
            const SizedBox(height: 24),
            Semantics(
              liveRegion: true,
              child: Text(
                q.instruction,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const SizedBox(height: 20),
            if (q.ticketNumber != null)
              _row(context, context.l10n.yourNumber, '${q.ticketNumber}'),
            if (q.currentTicketNumber != null)
              _row(
                context,
                context.l10n.currentPatient,
                '${q.currentTicketNumber}',
              ),
            _row(context, context.l10n.patientsAhead, '${q.patientsAhead}'),
            if (q.estimatedWait != null && !q.estimateSuspended)
              _row(
                context,
                context.l10n.estimatedWait,
                '${q.estimatedWait!.minimumMinutes}-${q.estimatedWait!.maximumMinutes} ${context.l10n.minutesShort}',
              ),
            if (problem != null) ...[
              const SizedBox(height: 16),
              Semantics(
                liveRegion: true,
                child: Text(_problem(context, problem)),
              ),
            ],
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: controller.load,
              child: Text(context.l10n.reload),
            ),
          ],
        ),
      ),
    ),
  );
  Widget _row(BuildContext context, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      children: [
        Expanded(child: Text(label)),
        Text(value, style: Theme.of(context).textTheme.titleLarge),
      ],
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
