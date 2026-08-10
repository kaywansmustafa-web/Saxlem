import 'package:flutter/material.dart';
import '../controllers/appointments_controller.dart';
import '../state/appointments_state.dart';
import '../widgets/appointment_card.dart';
import '../widgets/appointments_empty_state.dart';
import 'appointment_details_page.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../arrival/domain/repositories/patient_arrival_repository.dart';
import '../../../live_queue/domain/repositories/live_queue_repository.dart';
import '../../../notifications/domain/entities/notification_page.dart';

class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({
    required this.controller,
    required this.onDiscover,
    required this.repository,
    required this.bookingRepository,
    required this.onAppointmentsChanged,
    required this.arrivalRepository,
    required this.liveQueueRepository,
    this.notificationSignals,
    this.profilesController,
    super.key,
  });
  final AppointmentsController controller;
  final VoidCallback onDiscover;
  final PatientAppointmentsRepository repository;
  final BookingRepository bookingRepository;
  final PatientArrivalRepository arrivalRepository;
  final LiveQueueRepository liveQueueRepository;
  final Stream<NotificationSignal>? notificationSignals;
  final Future<void> Function() onAppointmentsChanged;
  final PatientProfilesController? profilesController;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => switch (controller.state) {
      AppointmentsLoading() => Center(
        child: Semantics(
          liveRegion: true,
          label: context.l10n.loadingAppointments,
          child: const CircularProgressIndicator(),
        ),
      ),
      AppointmentsFailure(:final problem) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_problem(context, problem)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: controller.load,
              child: Text(context.l10n.tryAgain),
            ),
          ],
        ),
      ),
      AppointmentsReady() => _ready(
        context,
        controller.state as AppointmentsReady,
      ),
    },
  );

  Widget _ready(BuildContext context, AppointmentsReady state) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(24, 24, 24, 14),
        child: Text(
          context.l10n.myAppointments,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      if (profilesController != null)
        Padding(
          padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
          child: PatientSelector(
            controller: profilesController!,
            label: context.l10n.currentPatient,
          ),
        ),
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsetsDirectional.symmetric(horizontal: 18),
        child: SegmentedButton<AppointmentsTab>(
          showSelectedIcon: false,
          segments: AppointmentsTab.values
              .map(
                (tab) => ButtonSegment(
                  value: tab,
                  label: Text(
                    context.l10n.tabWithCount(
                      _label(context, tab),
                      state.count(tab),
                    ),
                  ),
                ),
              )
              .toList(),
          selected: {state.selectedTab},
          onSelectionChanged: (selection) => controller.select(selection.first),
        ),
      ),
      const SizedBox(height: 14),
      Expanded(
        child: Column(
          children: [
            Expanded(
              child: state.visible.isEmpty
                  ? AppointmentsEmptyState(
                      firstTime: !state.snapshot.hasAppointmentHistory,
                      onDiscover: onDiscover,
                    )
                  : ListView.separated(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        24,
                        8,
                        24,
                        32,
                      ),
                      itemCount: state.visible.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final appointment = state.visible[index];
                        return AppointmentCard(
                          appointment: appointment,
                          onView: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AppointmentDetailsPage(
                                appointmentId: appointment.id,
                                repository: repository,
                                bookingRepository: bookingRepository,
                                arrivalRepository: arrivalRepository,
                                liveQueueRepository: liveQueueRepository,
                                notificationSignals: notificationSignals,
                                onChanged: onAppointmentsChanged,
                                profilesController: profilesController,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
            if (state.loadMoreProblem != null)
              Semantics(
                liveRegion: true,
                child: Text(_problem(context, state.loadMoreProblem!)),
              ),
            if (state.canLoadMore)
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 24),
                child: OutlinedButton(
                  onPressed: state.loadingMore ? null : controller.loadMore,
                  child: Text(
                    state.loadingMore
                        ? context.l10n.loadingMoreAppointments
                        : context.l10n.loadMore,
                  ),
                ),
              ),
          ],
        ),
      ),
    ],
  );

  String _label(BuildContext context, AppointmentsTab tab) => switch (tab) {
    AppointmentsTab.upcoming => context.l10n.upcoming,
    AppointmentsTab.completed => context.l10n.completed,
    AppointmentsTab.cancelled => context.l10n.cancelled,
  };

  String _problem(BuildContext context, AppointmentProblem problem) =>
      switch (problem) {
        AppointmentProblem.offline => context.l10n.offlineBody,
        AppointmentProblem.timeout => context.l10n.appointmentTimeout,
        AppointmentProblem.forbidden => context.l10n.appointmentForbidden,
        AppointmentProblem.sessionExpired => context.l10n.sessionExpiredBody,
        AppointmentProblem.notFound => context.l10n.appointmentNotFound,
        AppointmentProblem.conflict => context.l10n.staleAppointment,
        AppointmentProblem.validation => context.l10n.appointmentValidation,
        AppointmentProblem.malformed => context.l10n.patientAccountInvalid,
        AppointmentProblem.unknownOutcome =>
          context.l10n.appointmentUnknownOutcome,
        _ => context.l10n.appointmentsUnavailable,
      };
}
