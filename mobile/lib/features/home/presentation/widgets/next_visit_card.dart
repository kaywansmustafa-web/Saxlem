import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../../../appointments/domain/entities/patient_appointment.dart';
import '../../../appointments/domain/repositories/patient_appointments_repository.dart';

/// Home's first answer to "what's next?": the active patient's nearest booked
/// visit. Quietly absent when there is none or it can't be loaded.
class NextVisitCard extends StatefulWidget {
  const NextVisitCard({
    required this.repository,
    required this.profileId,
    required this.onOpen,
    this.now = DateTime.now,
    super.key,
  });
  final PatientAppointmentsRepository repository;
  final PatientProfileId profileId;
  final VoidCallback onOpen;
  final DateTime Function() now;

  @override
  State<NextVisitCard> createState() => _NextVisitCardState();
}

class _NextVisitCardState extends State<NextVisitCard> {
  PatientAppointment? _next;

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
        setState(() => _next = upcoming.isEmpty ? null : upcoming.first);
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
            onTap: widget.onOpen,
            child: Ink(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: colors.deepAura,
                borderRadius: BorderRadius.circular(SaxlemRadii.hero),
                boxShadow: SaxlemElevation.level2(colors.night),
              ),
              child: Row(
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
            ),
          ),
        ),
      ),
    );
  }
}
