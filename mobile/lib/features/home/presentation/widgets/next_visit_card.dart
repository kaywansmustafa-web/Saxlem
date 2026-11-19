import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../../../appointments/domain/entities/departure_plan.dart';
import '../../../appointments/domain/entities/patient_appointment.dart';
import '../../../appointments/presentation/leave_by/leave_by_panel.dart';
import '../../../appointments/presentation/leave_by/leave_by_services.dart';
import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import '../../../live_queue/domain/entities/patient_queue_status.dart';
import '../../../live_queue/domain/repositories/live_queue_repository.dart';
import '../../../discover/presentation/widgets/doctor_result_card.dart';

/// Home's first answer to "what's next?": the active patient's nearest booked
/// visit. Quietly absent when there is none or it can't be loaded.
class NextVisitCard extends StatefulWidget {
  const NextVisitCard({
    required this.repository,
    required this.profileId,
    required this.onOpen,
    this.liveQueue,
    this.onOpenVisit,
    this.onFound,
    this.leaveByServices,
    this.now = DateTime.now,
    super.key,
  });

  /// The phone's location and alerts, for "Leave by". Tests pass fakes.
  final LeaveByServices? leaveByServices;

  /// Called once this finds something to show (the patient has booked before).
  final VoidCallback? onFound;
  final PatientAppointmentsRepository repository;

  /// On the day of the visit, the card follows the live queue.
  final LiveQueueRepository? liveQueue;

  /// Opens this visit: the live queue once the patient is in it, otherwise
  /// the visit's page (to check in). Falls back to [onOpen].
  final void Function(String appointmentId, {required bool inQueue})?
  onOpenVisit;
  final PatientProfileId profileId;
  final VoidCallback onOpen;
  final DateTime Function() now;

  @override
  State<NextVisitCard> createState() => _NextVisitCardState();
}

class _NextVisitCardState extends State<NextVisitCard> {
  PatientAppointment? _next;
  PatientQueueStatus? _live;
  Timer? _poll;

  DeparturePlanner? get _planner => switch (widget.repository) {
    final DeparturePlanner planner => planner,
    _ => null,
  };

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  bool _isToday(PatientAppointment item) {
    final day = ClinicFormat.atClinic(item.startsAt);
    final today = ClinicFormat.atClinic(widget.now());
    return day.year == today.year &&
        day.month == today.month &&
        day.day == today.day;
  }

  /// Follows the queue every 30 seconds while today's visit is on screen.
  void _follow(PatientAppointment? next) {
    _poll?.cancel();
    _live = null;
    final queue = widget.liveQueue;
    if (next == null || queue == null || !_isToday(next)) return;
    Future<void> read() async {
      try {
        final status = await queue.getQueueStatus(next.id);
        if (mounted) setState(() => _live = status);
      } catch (_) {
        // The card still shows the visit; the live line just waits.
      }
    }

    read();
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => read());
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(NextVisitCard old) {
    super.didUpdateWidget(old);
    if (old.profileId != widget.profileId) _load();
  }

  Future<void> _load() async {
    final now = widget.now();
    try {
      final pages = await Future.wait([
        for (final status in const [
          PatientAppointmentStatus.scheduled,
          PatientAppointmentStatus.confirmed,
        ])
          widget.repository.list(
            AppointmentListRequest(
              profileId: widget.profileId,
              from: now.subtract(const Duration(hours: 2)),
              to: now.add(const Duration(days: 60)),
              status: status,
              pageSize: 5,
            ),
          ),
      ]);
      final upcoming =
          pages
              .expand((page) => page.items)
              .where((item) => item.endsAt.isAfter(now))
              .toList()
            ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
      if (mounted) {
        final next = upcoming.isEmpty ? null : upcoming.first;
        setState(() => _next = next);
        _follow(next);
        if (_planner != null) {
          // A "time to leave" alert for a visit that's no longer coming up
          // (cancelled by the clinic, say) must not fire.
          unawaited(
            (widget.leaveByServices ?? LeaveByServices.device).alerts.keepOnly(
              widget.profileId.value,
              {for (final item in upcoming) item.id},
            ),
          );
        }
        if (next != null) widget.onFound?.call();
      }
    } catch (_) {
      if (mounted) setState(() => _next = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final next = _next;
    if (next == null) return const SizedBox.shrink();
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final strings = context.l10n;
    final language = Localizations.localeOf(context).languageCode;
    final day = ClinicFormat.atClinic(next.startsAt);
    final today = ClinicFormat.atClinic(widget.now());
    final days = DateTime(
      day.year,
      day.month,
      day.day,
    ).difference(DateTime(today.year, today.month, today.day)).inDays;
    final when = days == 0
        ? strings.todayChip
        : days == 1
        ? strings.tomorrowChip
        : ClinicFormat.clinicDay(next.startsAt, language);
    final live = _live;
    final ticket = _inQueue ? live?.ticketNumber : null;
    final queueOpen = live != null && live.queueState == QueueState.open;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 16),
      child: Semantics(
        button: true,
        label:
            '${strings.nextVisitTitle}: ${next.doctor.displayName}, $when, ${ClinicFormat.time(next.startsAt)}',
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(SaxlemRadii.hero),
            onTap: () {
              final open = widget.onOpenVisit;
              if (open == null) return widget.onOpen();
              open(next.id, inQueue: _inQueue);
            },
            child: Ink(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: colors.hero,
                borderRadius: BorderRadius.circular(SaxlemRadii.hero),
                border: Border.all(color: colors.heroBorder),
                boxShadow: [
                  BoxShadow(
                    color: colors.brandFill.withValues(
                      alpha: colors.isDark ? .25 : .16,
                    ),
                    blurRadius: 50,
                    offset: const Offset(0, 20),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: SaxlemDataLabel(
                          '${strings.nextVisitTitle} · $when',
                          color: colors.heroContentMuted,
                        ),
                      ),
                      if (queueOpen) ...[
                        const SizedBox(width: 8),
                        SaxlemStatusPill(
                          label: strings.liveQueue,
                          tone: SaxlemStatusTone.live,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      SaxlemAvatar(
                        semanticLabel: next.doctor.displayName,
                        initials: doctorInitials(next.doctor.displayName),
                        size: 48,
                        ring: true,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              next.doctor.displayName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.titleLarge?.copyWith(
                                color: colors.heroContent,
                                fontSize: 19,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              next.clinicName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.heroContentMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        rtl
                            ? Icons.chevron_left_rounded
                            : Icons.chevron_right_rounded,
                        color: colors.heroContentMuted,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        ClinicFormat.time(next.startsAt),
                        style: theme.textTheme.displayMedium?.copyWith(
                          color: colors.heroContent,
                          fontSize: 44,
                          height: 1,
                        ),
                      ),
                      const Spacer(),
                      if (ticket != null)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            SaxlemDataLabel(
                              strings.yourNumber,
                              color: colors.heroContentMuted,
                              size: 10,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$ticket',
                              style: theme.textTheme.headlineMedium?.copyWith(
                                color: colors.liveContent,
                                height: 1,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  if (!_inQueue)
                    LeaveByPanel(
                      key: ValueKey('leave-${next.id}'),
                      appointment: next,
                      planner: _planner,
                      services: widget.leaveByServices,
                      look: LeaveByLook.onHero,
                      now: widget.now,
                    ),
                  if (_liveLine(context) case final line?) ...[
                    const SizedBox(height: 14),
                    Semantics(
                      liveRegion: true,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: colors.heroStrip,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: colors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: colors.liveSurface,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                line.icon,
                                size: 20,
                                color: colors.liveContent,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                line.text,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: colors.heroContent,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  bool get _inQueue => switch (_live?.patientEntryStatus) {
    PatientEntryStatus.waiting ||
    PatientEntryStatus.called ||
    PatientEntryStatus.inConsultation ||
    PatientEntryStatus.noResponse => true,
    _ => false,
  };

  /// What the live queue says about today's visit, in a patient's words.
  ({IconData icon, String text})? _liveLine(BuildContext context) {
    final live = _live;
    if (live == null) return null;
    final strings = context.l10n;
    return switch (live.patientEntryStatus) {
      PatientEntryStatus.called => (
        icon: Icons.campaign_rounded,
        text: strings.ntfCalledTitle,
      ),
      PatientEntryStatus.inConsultation => (
        icon: Icons.medical_services_rounded,
        text: strings.liveWithDoctor,
      ),
      PatientEntryStatus.waiting when live.queueState == QueueState.paused => (
        icon: Icons.pause_circle_outline_rounded,
        text: strings.ntfPausedTitle,
      ),
      PatientEntryStatus.waiting => (
        icon: Icons.confirmation_number_outlined,
        text: [
          if (live.ticketNumber case final ticket?) strings.ntfTicket(ticket),
          live.patientsAhead == 0
              ? strings.ntfNextTitle
              : strings.ntfAhead(live.patientsAhead),
          if (live.estimatedWait case final wait? when !live.estimateSuspended)
            strings.liveWait(wait.minimumMinutes, wait.maximumMinutes),
        ].join(' · '),
      ),
      PatientEntryStatus.notEnqueued =>
        live.queueState == QueueState.open
            ? (icon: Icons.how_to_reg_rounded, text: strings.liveCheckIn)
            : (icon: Icons.schedule_rounded, text: strings.liveNotOpen),
      _ => null,
    };
  }
}
