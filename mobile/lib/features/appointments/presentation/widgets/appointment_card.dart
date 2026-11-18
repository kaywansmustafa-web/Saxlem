import '../../../../core/formatting/clinic_format.dart';
import 'package:flutter/material.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/content/saxlem_status_pill.dart';
import '../../../../design_system/foundations/saxlem_elevation.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';

/// One appointment in the list (v2 "Aura"): a date tile, the doctor, time and
/// clinic, and a status pill. The whole card opens the appointment.
class AppointmentCard extends StatelessWidget {
  const AppointmentCard({
    required this.appointment,
    required this.onView,
    super.key,
  });
  final PatientAppointment appointment;
  final VoidCallback onView;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final date = ClinicFormat.clinicDay(
      appointment.startsAt,
      Localizations.localeOf(context).languageCode,
    );
    final time = ClinicFormat.time(appointment.startsAt);
    final now = DateTime.now();
    final isToday = DateUtils.isSameDay(appointment.startsAt, now);
    return Semantics(
      button: true,
      label:
          '${appointment.doctor.displayName}, $date, $time, '
          '${appointmentStatusLabel(context, appointment.status)}. '
          '${context.l10n.viewAppointment}',
      child: Material(
        type: MaterialType.transparency,
        child: Ink(
          decoration: BoxDecoration(
            color: colors.surfaceRaised,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            border: Border.all(color: colors.border),
            boxShadow: SaxlemElevation.level1(colors.night),
          ),
          child: InkWell(
            onTap: onView,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            child: Padding(
              padding: const EdgeInsetsDirectional.all(14),
              child: ExcludeSemantics(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppointmentDateTile(
                      date: appointment.startsAt,
                      highlighted: isToday && appointment.canMutate,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  appointment.doctor.displayName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontFamily:
                                        theme.textTheme.titleLarge?.fontFamily,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              SaxlemStatusPill(
                                label: appointmentStatusLabel(
                                  context,
                                  appointment.status,
                                ),
                                tone: appointmentStatusTone(appointment.status),
                              ),
                            ],
                          ),
                          if (appointment
                              .doctor
                              .specialtyDisplayName
                              .isNotEmpty)
                            Text(
                              appointment.doctor.specialtyDisplayName,
                              style: theme.textTheme.bodySmall,
                            ),
                          const SizedBox(height: 10),
                          _Line(
                            icon: Icons.schedule_rounded,
                            text: appointment.canMutate
                                ? '$time · ${context.l10n.consultationMinutes(appointment.durationMinutes)}'
                                : time,
                          ),
                          const SizedBox(height: 4),
                          _Line(
                            icon: Icons.location_on_outlined,
                            text: appointment.clinicName,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 16, color: context.saxlemColors.textSecondary),
      const SizedBox(width: 6),
      Expanded(
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: context.saxlemColors.textPrimary,
          ),
        ),
      ),
    ],
  );
}

/// A month-and-day tile. [highlighted] (today's upcoming visit) uses the Deep
/// Aura gradient with white text.
class AppointmentDateTile extends StatelessWidget {
  const AppointmentDateTile({
    required this.date,
    this.highlighted = false,
    this.size = 64,
    super.key,
  });
  final DateTime date;
  final bool highlighted;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final ink = highlighted ? colors.onFill : colors.brandPrimary;
    final lang = Localizations.localeOf(context).languageCode;
    final at = ClinicFormat.atClinic(date);
    return Container(
      width: size,
      padding: const EdgeInsetsDirectional.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: highlighted ? null : colors.brandTint,
        gradient: highlighted ? colors.deepAura : null,
        borderRadius: BorderRadius.circular(SaxlemRadii.medium),
      ),
      child: Column(
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              ClinicFormat.month(at, lang),
              maxLines: 1,
              style: theme.textTheme.labelSmall?.copyWith(
                color: ink.withValues(alpha: highlighted ? .9 : 1),
              ),
            ),
          ),
          Text(
            '${at.day}',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: ink,
              height: 1.1,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          Text(
            ClinicFormat.weekdayShort(at, lang),
            maxLines: 1,
            overflow: TextOverflow.fade,
            softWrap: false,
            style: theme.textTheme.labelSmall?.copyWith(
              color: highlighted
                  ? colors.onFill.withValues(alpha: .9)
                  : colors.textSecondary,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

String appointmentStatusLabel(
  BuildContext context,
  PatientAppointmentStatus status,
) => switch (status) {
  PatientAppointmentStatus.scheduled => context.l10n.scheduled,
  PatientAppointmentStatus.confirmed => context.l10n.confirmed,
  PatientAppointmentStatus.completed => context.l10n.completed,
  PatientAppointmentStatus.cancelled => context.l10n.cancelled,
  PatientAppointmentStatus.noShow => context.l10n.noShow,
};

SaxlemStatusTone appointmentStatusTone(PatientAppointmentStatus status) =>
    switch (status) {
      PatientAppointmentStatus.confirmed => SaxlemStatusTone.positive,
      PatientAppointmentStatus.scheduled => SaxlemStatusTone.informative,
      PatientAppointmentStatus.completed => SaxlemStatusTone.neutral,
      PatientAppointmentStatus.cancelled => SaxlemStatusTone.critical,
      PatientAppointmentStatus.noShow => SaxlemStatusTone.caution,
    };
