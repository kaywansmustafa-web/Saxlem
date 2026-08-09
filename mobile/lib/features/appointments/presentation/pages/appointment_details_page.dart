/* Legacy in-memory appointment detail retained only for source history.
import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../live_queue/live_queue_feature.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';

class AppointmentDetailsPage extends StatelessWidget {
  const AppointmentDetailsPage({
    required this.appointment,
    this.profilesController,
    super.key,
  });
  final PatientAppointment appointment;
  final PatientProfilesController? profilesController;

  bool _isToday(DateTime value) {
    final now = DateTime.now();
    return value.year == now.year &&
        value.month == now.month &&
        value.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    final localizations = MaterialLocalizations.of(context);
    final today = _isToday(appointment.scheduledAt);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(context.l10n.appointmentDetails)),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsetsDirectional.only(top: 20, bottom: 36),
          child: SaxlemResponsiveContent(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (profilesController != null) ...[
                  PatientSelector(
                    controller: profilesController!,
                    label: context.l10n.currentPatient,
                  ),
                  const SizedBox(height: 18),
                ],
                Text(
                  appointment.doctor.displayName,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(appointment.doctor.specialtyDisplayName),
                const SizedBox(height: 22),
                _DetailsCard(
                  children: [
                    _Row(context.l10n.clinic, appointment.clinicName),
                    _Row(
                      context.l10n.date,
                      localizations.formatMediumDate(appointment.scheduledAt),
                    ),
                    _Row(
                      context.l10n.time,
                      localizations.formatTimeOfDay(
                        TimeOfDay.fromDateTime(appointment.scheduledAt),
                      ),
                    ),
                    _Row(context.l10n.status, _status(context)),
                    _Row(
                      context.l10n.fee,
                      context.l10n.iqdAmount(appointment.feeIqd),
                    ),
                    _Row(
                      context.l10n.duration,
                      context.l10n.minutesLong(appointment.durationMinutes),
                    ),
                    _Row(context.l10n.appointmentId, appointment.id),
                  ],
                ),
                const SizedBox(height: 18),
                Semantics(
                  liveRegion: true,
                  child: Text(
                    today
                        ? appointment.queueEntryId == null
                              ? context.l10n.queueNotReady
                              : context.l10n.queueAvailableToday
                        : context.l10n.queueOpensAppointmentDay,
                  ),
                ),
                if (today) ...[
                  const SizedBox(height: 18),
                  if (appointment.queueEntryId != null)
                    FilledButton(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => LiveQueueFeature(
                            queueEntryId: appointment.queueEntryId!,
                          ),
                        ),
                      ),
                      child: Text(context.l10n.openLiveQueue),
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _status(BuildContext context) => switch (appointment.status) {
    PatientAppointmentStatus.upcoming => context.l10n.upcoming,
    PatientAppointmentStatus.completed => context.l10n.completed,
    PatientAppointmentStatus.cancelled => context.l10n.cancelled,
  };
}

class _DetailsCard extends StatelessWidget {
  const _DetailsCard({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.all(20),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(children: children),
  );
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodySmall),
        ),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );
}
*/

import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../booking/domain/services/booking_operation_id.dart';
import '../../../booking/presentation/widgets/slot_grid.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../controllers/appointment_detail_controller.dart';
import '../state/appointment_detail_state.dart';

class AppointmentDetailsPage extends StatefulWidget {
  const AppointmentDetailsPage({
    required this.appointmentId,
    required this.repository,
    required this.bookingRepository,
    required this.onChanged,
    required this.profilesController,
    super.key,
  });
  final String appointmentId;
  final PatientAppointmentsRepository repository;
  final BookingRepository bookingRepository;
  final Future<void> Function() onChanged;
  final PatientProfilesController? profilesController;

  @override
  State<AppointmentDetailsPage> createState() => _AppointmentDetailsPageState();
}

class _AppointmentDetailsPageState extends State<AppointmentDetailsPage> {
  late final AppointmentDetailController controller;
  final _statusFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    controller = AppointmentDetailController(
      appointmentId: widget.appointmentId,
      profileId:
          widget.profilesController?.activeProfileId ??
          const PatientProfileId('invalid'),
      repository: widget.repository,
      bookingRepository: widget.bookingRepository,
      operationIds: SecureBookingOperationIdGenerator(),
      onChanged: widget.onChanged,
    )..load();
    widget.profilesController?.addListener(_profileChanged);
  }

  void _profileChanged() =>
      controller.changeProfile(widget.profilesController!.activeProfileId);

  @override
  void dispose() {
    widget.profilesController?.removeListener(_profileChanged);
    _statusFocus.dispose();
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(title: Text(context.l10n.appointmentDetails)),
    body: SafeArea(
      top: false,
      child: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => switch (controller.state) {
          AppointmentDetailLoading() => const Center(
            child: CircularProgressIndicator(),
          ),
          AppointmentDetailFailure(:final problem) => _failure(problem),
          AppointmentDetailReady() => _ready(
            controller.state as AppointmentDetailReady,
          ),
        },
      ),
    ),
  );

  Widget _failure(AppointmentProblem problem) => Center(
    child: Padding(
      padding: const EdgeInsetsDirectional.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Semantics(
            header: true,
            liveRegion: true,
            child: Text(_problem(problem)),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: controller.load,
            child: Text(context.l10n.reload),
          ),
        ],
      ),
    ),
  );

  Widget _ready(AppointmentDetailReady detail) {
    final item = detail.appointment;
    final material = MaterialLocalizations.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.only(top: 20, bottom: 36),
      child: SaxlemResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(
              header: true,
              child: Text(
                item.doctor.displayName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            const SizedBox(height: 18),
            _DetailsCard(
              children: [
                _DetailRow(context.l10n.appointmentReference, item.reference),
                _DetailRow(context.l10n.clinic, item.clinicName),
                _DetailRow(context.l10n.patient, item.patientName),
                _DetailRow(
                  context.l10n.appointmentType,
                  item.type == PatientAppointmentType.initial
                      ? context.l10n.initialAppointment
                      : context.l10n.followUpAppointment,
                ),
                _DetailRow(context.l10n.appointmentReason, item.reason),
                _DetailRow(
                  context.l10n.date,
                  material.formatMediumDate(item.startsAt),
                ),
                _DetailRow(
                  context.l10n.time,
                  material.formatTimeOfDay(
                    TimeOfDay.fromDateTime(item.startsAt),
                  ),
                ),
                _DetailRow(context.l10n.status, _status(item.status)),
                _DetailRow(
                  context.l10n.fee,
                  context.l10n.iqdAmount(item.feeIqd),
                ),
                _DetailRow(
                  context.l10n.duration,
                  context.l10n.minutesLong(item.durationMinutes),
                ),
                if (item.cancellationReason case final reason?)
                  _DetailRow(context.l10n.cancellationReason, reason),
              ],
            ),
            if (detail.problem != null) ...[
              const SizedBox(height: 16),
              Focus(
                focusNode: _statusFocus,
                child: Semantics(
                  liveRegion: true,
                  child: Text(_problem(detail.problem!)),
                ),
              ),
            ],
            if (item.canMutate) ...[
              const SizedBox(height: 20),
              FilledButton(
                onPressed: detail.submitting ? null : _cancel,
                child: Text(context.l10n.cancelAppointment),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: detail.submitting
                    ? null
                    : controller.loadRescheduleOptions,
                child: Text(context.l10n.rescheduleAppointment),
              ),
            ],
            if (detail.loadingAvailability) ...[
              const SizedBox(height: 20),
              const Center(child: CircularProgressIndicator()),
            ],
            if (detail.availability case final availability?) ...[
              const SizedBox(height: 24),
              Semantics(
                header: true,
                child: Text(
                  context.l10n.chooseNewDateTime,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              const SizedBox(height: 12),
              ...availability.days.map(
                (day) => Padding(
                  padding: const EdgeInsetsDirectional.only(bottom: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(material.formatMediumDate(day.date)),
                      const SizedBox(height: 8),
                      if (day.slots.isEmpty)
                        Text(context.l10n.noAvailableSlots)
                      else
                        SlotGrid(
                          slots: day.slots,
                          timezone: availability.clinicTimezone,
                          onSelected: controller.reschedule,
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _cancel() async {
    final field = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.l10n.cancelAppointment),
        content: TextField(
          controller: field,
          autofocus: true,
          maxLength: 500,
          maxLines: 3,
          decoration: InputDecoration(
            labelText: context.l10n.cancellationReason,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(context.l10n.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, field.text),
            child: Text(context.l10n.confirmCancellation),
          ),
        ],
      ),
    );
    field.dispose();
    if (reason == null || !mounted) return;
    await controller.cancel(reason);
    if (mounted) _statusFocus.requestFocus();
  }

  String _status(PatientAppointmentStatus status) => switch (status) {
    PatientAppointmentStatus.scheduled => context.l10n.scheduled,
    PatientAppointmentStatus.confirmed => context.l10n.confirmed,
    PatientAppointmentStatus.cancelled => context.l10n.cancelled,
    PatientAppointmentStatus.completed => context.l10n.completed,
    PatientAppointmentStatus.noShow => context.l10n.noShow,
  };

  String _problem(AppointmentProblem problem) => switch (problem) {
    AppointmentProblem.offline => context.l10n.offlineBody,
    AppointmentProblem.timeout => context.l10n.appointmentTimeout,
    AppointmentProblem.forbidden => context.l10n.appointmentForbidden,
    AppointmentProblem.sessionExpired => context.l10n.sessionExpiredBody,
    AppointmentProblem.notFound => context.l10n.appointmentNotFound,
    AppointmentProblem.conflict => context.l10n.staleAppointment,
    AppointmentProblem.validation => context.l10n.appointmentValidation,
    AppointmentProblem.malformed => context.l10n.patientAccountInvalid,
    AppointmentProblem.unknownOutcome => context.l10n.appointmentUnknownOutcome,
    _ => context.l10n.appointmentsUnavailable,
  };
}

class _DetailsCard extends StatelessWidget {
  const _DetailsCard({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.all(20),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(children: children),
  );
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label)),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );
}
