import '../../../../core/formatting/clinic_format.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../design_system/design_system.dart';
import '../../../booking/presentation/widgets/booking_day_picker.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../booking/domain/services/booking_operation_id.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../controllers/appointment_detail_controller.dart';
import '../state/appointment_detail_state.dart';
import '../../../arrival/domain/entities/patient_arrival.dart';
import '../../../arrival/domain/repositories/patient_arrival_repository.dart';
import '../../../arrival/presentation/controllers/patient_arrival_controller.dart';
import '../../../arrival/presentation/state/patient_arrival_state.dart';
import '../../../live_queue/domain/repositories/live_queue_repository.dart';
import '../../../live_queue/live_queue_feature.dart';
import '../../../notifications/domain/entities/notification_page.dart';
import '../../../payments/presentation/widgets/appointment_payment_card.dart';

class AppointmentDetailsPage extends StatefulWidget {
  const AppointmentDetailsPage({
    required this.appointmentId,
    required this.repository,
    required this.bookingRepository,
    required this.onChanged,
    required this.profilesController,
    required this.arrivalRepository,
    required this.liveQueueRepository,
    this.notificationSignals,
    super.key,
  });
  final String appointmentId;
  final PatientAppointmentsRepository repository;
  final BookingRepository bookingRepository;
  final Future<void> Function() onChanged;
  final PatientProfilesController? profilesController;
  final PatientArrivalRepository arrivalRepository;
  final LiveQueueRepository liveQueueRepository;
  final Stream<NotificationSignal>? notificationSignals;

  @override
  State<AppointmentDetailsPage> createState() => _AppointmentDetailsPageState();
}

class _AppointmentDetailsPageState extends State<AppointmentDetailsPage> {
  late final AppointmentDetailController controller;
  late PatientArrivalController arrivalController;
  bool _arrivalLoadRequested = false;
  StreamSubscription<NotificationSignal>? _notificationSubscription;
  Timer? _refreshDebounce;
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
    _createArrivalController();
    _notificationSubscription = widget.notificationSignals?.listen((signal) {
      final profile = signal.notification.profileId?.value;
      final selected = widget.profilesController?.activeProfileId.value;
      if (profile != null && profile != selected) return;
      _refreshDebounce?.cancel();
      _refreshDebounce = Timer(const Duration(milliseconds: 300), () {
        if (mounted && _arrivalLoadRequested) arrivalController.load();
      });
    }, onError: (_) => arrivalController.invalidate());
    widget.profilesController?.addListener(_profileChanged);
  }

  void _createArrivalController() {
    arrivalController = PatientArrivalController(
      appointmentId: widget.appointmentId,
      expectedProfileId: widget.profilesController?.activeProfileId.value ?? '',
      repository: widget.arrivalRepository,
      operationIds: SecureBookingOperationIdGenerator(),
    );
  }

  void _profileChanged() {
    controller.changeProfile(widget.profilesController!.activeProfileId);
    arrivalController.dispose();
    _arrivalLoadRequested = false;
    _createArrivalController();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    widget.profilesController?.removeListener(_profileChanged);
    _refreshDebounce?.cancel();
    _notificationSubscription?.cancel();
    _statusFocus.dispose();
    controller.dispose();
    arrivalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(context.l10n.appointmentDetails),
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
    ),
    body: SaxlemAuraBackdrop(
      strength: .7,
      child: SafeArea(
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
    if (item.canMutate && !_arrivalLoadRequested) {
      _arrivalLoadRequested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) arrivalController.load();
      });
    }
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.only(top: 20, bottom: 36),
      child: SaxlemResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _AppointmentHero(
              appointment: item,
              statusLabel: _status(item.status),
            ),
            const SizedBox(height: 16),
            _DetailsCard(
              children: [
                _DetailRow(context.l10n.patient, item.patientName),
                _DetailRow(
                  context.l10n.appointmentType,
                  item.type == PatientAppointmentType.initial
                      ? context.l10n.initialAppointment
                      : context.l10n.followUpAppointment,
                ),
                _DetailRow(context.l10n.appointmentReason, item.reason),
                _DetailRow(
                  context.l10n.fee,
                  context.l10n.iqdAmount(ClinicFormat.number(item.feeIqd)),
                ),
                _DetailRow(
                  context.l10n.duration,
                  context.l10n.minutesLong(item.durationMinutes),
                ),
                _DetailRow(context.l10n.appointmentReference, item.reference),
                if (item.cancellationReason case final reason?)
                  _DetailRow(context.l10n.cancellationReason, reason),
              ],
            ),
            const SizedBox(height: 16),
            AppointmentPaymentCard(
              appointmentId: item.id,
              title: item.doctor.displayName,
              subtitle: item.clinicName,
            ),
            if (item.canMutate) ...[
              const SizedBox(height: 20),
              _arrivalExperience(),
            ],
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
              SaxlemButton(
                label: context.l10n.rescheduleAppointment,
                leadingIcon: Icons.event_repeat_rounded,
                hierarchy: SaxlemButtonHierarchy.secondary,
                expand: true,
                onPressed: detail.submitting
                    ? null
                    : controller.loadRescheduleOptions,
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: detail.submitting ? null : _cancel,
                style: TextButton.styleFrom(
                  foregroundColor: context.saxlemColors.criticalContent,
                  minimumSize: const Size.fromHeight(48),
                ),
                icon: const Icon(Icons.event_busy_rounded, size: 20),
                label: Text(context.l10n.cancelAppointment),
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
              BookingDayPicker(
                days: availability.days,
                timezone: availability.clinicTimezone,
                emptyLabel: context.l10n.noAvailableSlots,
                onSelected: controller.reschedule,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _arrivalExperience() => ListenableBuilder(
    listenable: arrivalController,
    builder: (context, _) => switch (arrivalController.state) {
      PatientArrivalInitial() || PatientArrivalLoading() => const Center(
        child: CircularProgressIndicator(),
      ),
      PatientArrivalFailed() => Semantics(
        liveRegion: true,
        child: _ArrivalPanel(
          children: [
            Text(
              context.l10n.queueNotReady,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            TextButton(
              onPressed: arrivalController.load,
              child: Text(context.l10n.reload),
            ),
          ],
        ),
      ),
      PatientArrivalReady(:final arrival, :final submitting, :final problem) =>
        Semantics(
          container: true,
          liveRegion: true,
          child: _ArrivalPanel(
            children: [
              Text(
                context.l10n.queueUpdates,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 6),
              Text(
                _arrivalMessage(arrival),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (problem != null) Text(context.l10n.appointmentUnknownOutcome),
              if (arrival.eligibility.canArrive) ...[
                const SizedBox(height: 14),
                SaxlemButton(
                  label: context.l10n.recordArrival,
                  leadingIcon: Icons.where_to_vote_rounded,
                  loading: submitting,
                  expand: true,
                  onPressed: arrivalController.recordArrival,
                ),
              ],
              if (arrival.status == ArrivalStatus.queueReady) ...[
                const SizedBox(height: 14),
                SaxlemButton(
                  label: context.l10n.openLiveQueue,
                  trailingIcon: Icons.arrow_forward_rounded,
                  expand: true,
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => LiveQueueFeature(
                        appointmentId: widget.appointmentId,
                        repository: widget.liveQueueRepository,
                        notificationSignals: widget.notificationSignals,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
    },
  );

  String _arrivalMessage(PatientArrival arrival) {
    if (arrival.status == ArrivalStatus.queueReady) {
      return context.l10n.queueAvailableToday;
    }
    if (arrival.status == ArrivalStatus.arrived) {
      return context.l10n.notificationReservedWhy;
    }
    return switch (arrival.eligibility.reason) {
      ArrivalEligibilityReason.tooEarly
          when arrival.eligibility.opensAt != null =>
        '${context.l10n.queueOpensAppointmentDay} ${ClinicFormat.time(arrival.eligibility.opensAt!)}',
      ArrivalEligibilityReason.tooLate ||
      ArrivalEligibilityReason.invalidAppointmentStatus ||
      ArrivalEligibilityReason.unavailable => context.l10n.actionUnavailable,
      _ => context.l10n.queueNotReady,
    };
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
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 18,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.card),
        border: Border.all(color: colors.border),
        boxShadow: SaxlemElevation.level1(colors.night),
      ),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Divider(height: 1, color: colors.divider),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(vertical: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: theme.textTheme.titleSmall,
            ),
          ),
        ],
      ),
    );
  }
}

class _ArrivalPanel extends StatelessWidget {
  const _ArrivalPanel({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.all(18),
    decoration: BoxDecoration(
      color: context.saxlemColors.brandTint,
      borderRadius: BorderRadius.circular(SaxlemRadii.card),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    ),
  );
}

/// The top of an appointment: doctor, status, date, time and clinic. Upcoming
/// visits sit on the Deep Aura gradient; past ones on a plain card.
class _AppointmentHero extends StatelessWidget {
  const _AppointmentHero({
    required this.appointment,
    required this.statusLabel,
  });
  final PatientAppointment appointment;
  final String statusLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final active = appointment.canMutate;
    final ink = active ? colors.onFill : colors.textPrimary;
    final sub = active
        ? colors.onFill.withValues(alpha: .88)
        : colors.textSecondary;
    final initials = appointment.doctor.displayName
        .replaceFirst(RegExp(r'^(Dr\.?|د\.)\s*', caseSensitive: false), '')
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .take(2)
        .map((p) => p.characters.first.toUpperCase())
        .join();
    Widget chip(IconData icon, String text) => Expanded(
      child: Container(
        padding: const EdgeInsetsDirectional.all(12),
        decoration: BoxDecoration(
          color: active
              ? colors.onFill.withValues(alpha: .14)
              : colors.surfaceSunken,
          borderRadius: BorderRadius.circular(SaxlemRadii.medium),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: ink),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                text,
                maxLines: 2,
                style: theme.textTheme.titleSmall?.copyWith(color: ink),
              ),
            ),
          ],
        ),
      ),
    );
    return Semantics(
      header: true,
      label: '${appointment.doctor.displayName}. $statusLabel',
      child: Container(
        padding: const EdgeInsetsDirectional.all(20),
        decoration: BoxDecoration(
          color: active ? null : colors.surfaceRaised,
          gradient: active ? colors.deepAura : null,
          borderRadius: BorderRadius.circular(SaxlemRadii.hero),
          border: active ? null : Border.all(color: colors.border),
          boxShadow: active
              ? SaxlemElevation.glow(colors.brandPrimary)
              : SaxlemElevation.level1(colors.night),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: active
                        ? colors.onFill.withValues(alpha: .2)
                        : colors.brandTint,
                  ),
                  child: Text(
                    initials,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: active ? colors.onFill : colors.brandPrimary,
                      fontFamily: theme.textTheme.titleLarge?.fontFamily,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.doctor.displayName,
                        style: theme.textTheme.titleLarge?.copyWith(color: ink),
                      ),
                      if (appointment.doctor.specialtyDisplayName.isNotEmpty)
                        Text(
                          appointment.doctor.specialtyDisplayName,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: sub,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsetsDirectional.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: active ? colors.onFill : colors.surfaceSunken,
                    borderRadius: BorderRadius.circular(SaxlemRadii.full),
                  ),
                  child: Text(
                    statusLabel,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: active ? colors.night : colors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                chip(
                  Icons.calendar_today_rounded,
                  ClinicFormat.clinicDay(
                    appointment.startsAt,
                    Localizations.localeOf(context).languageCode,
                  ),
                ),
                const SizedBox(width: 10),
                chip(
                  Icons.schedule_rounded,
                  ClinicFormat.time(appointment.startsAt),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 18, color: sub),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    appointment.clinicName,
                    style: theme.textTheme.bodyMedium?.copyWith(color: sub),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
