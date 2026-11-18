import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../../../appointments/domain/entities/patient_appointment.dart';
import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import '../../../live_queue/domain/entities/patient_queue_status.dart';
import '../../../live_queue/domain/repositories/live_queue_repository.dart';

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
    this.now = DateTime.now,
    super.key,
  });

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
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: colors.deepAura,
                borderRadius: BorderRadius.circular(SaxlemRadii.hero),
                boxShadow: SaxlemElevation.level2(colors.night),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 62,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: colors.onFill.withValues(alpha: .16),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Text(
                              ClinicFormat.time(next.startsAt),
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: colors.onFill,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${strings.nextVisitTitle} · $when',
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: colors.onFill.withValues(alpha: .85),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              next.doctor.displayName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: colors.onFill,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              next.clinicName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.onFill.withValues(alpha: .85),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Directionality.of(context) == TextDirection.rtl
                            ? Icons.chevron_left_rounded
                            : Icons.chevron_right_rounded,
                        color: colors.onFill,
                      ),
                    ],
                  ),
                  if (_liveLine(context) case final line?) ...[
                    const SizedBox(height: 14),
                    Semantics(
                      liveRegion: true,
                      child: Container(
                        padding: const EdgeInsetsDirectional.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: colors.onFill.withValues(alpha: .16),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Icon(line.icon, size: 18, color: colors.onFill),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                line.text,
                                style: theme.textTheme.labelLarge?.copyWith(
                                  color: colors.onFill,
                                  fontWeight: FontWeight.w700,
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
