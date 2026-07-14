import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../../../core/localization/localization_extensions.dart';

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
    final date = MaterialLocalizations.of(
      context,
    ).formatMediumDate(appointment.scheduledAt);
    final time = MaterialLocalizations.of(
      context,
    ).formatTimeOfDay(TimeOfDay.fromDateTime(appointment.scheduledAt));
    return Semantics(
      container: true,
      label: '${appointment.doctor.displayName}, $date, $time',
      child: Container(
        padding: const EdgeInsetsDirectional.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  child: Text(appointment.doctor.displayName.characters.first),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.doctor.displayName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      Text(appointment.doctor.specialtyDisplayName),
                    ],
                  ),
                ),
                _Status(status: appointment.status),
              ],
            ),
            const SizedBox(height: 16),
            Text(appointment.clinicName),
            const SizedBox(height: 6),
            Text('$date  •  $time'),
            if (appointment.status == PatientAppointmentStatus.upcoming) ...[
              const SizedBox(height: 6),
              Text(
                context.l10n.consultationMinutes(appointment.durationMinutes),
              ),
              if (appointment.estimatedWaitMinutes != null)
                Text(
                  context.l10n.estimatedWaitMinutes(
                    appointment.estimatedWaitMinutes!,
                  ),
                ),
            ],
            const SizedBox(height: 6),
            Text(
              context.l10n.appointmentIdValue(appointment.id),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            if (appointment.status == PatientAppointmentStatus.upcoming)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onView,
                  child: Text(context.l10n.viewAppointment),
                ),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Semantics(
                    label: context.l10n.actionUnavailable,
                    enabled: false,
                    child: OutlinedButton(
                      onPressed: null,
                      child: Text(
                        appointment.status == PatientAppointmentStatus.cancelled
                            ? context.l10n.viewDoctor
                            : context.l10n.rateVisit,
                      ),
                    ),
                  ),
                  Semantics(
                    label: context.l10n.actionUnavailable,
                    enabled: false,
                    child: TextButton(
                      onPressed: null,
                      child: Text(context.l10n.bookAgain),
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

class _Status extends StatelessWidget {
  const _Status({required this.status});
  final PatientAppointmentStatus status;
  @override
  Widget build(BuildContext context) => Text(
    switch (status) {
      PatientAppointmentStatus.upcoming => context.l10n.upcoming,
      PatientAppointmentStatus.completed => context.l10n.completed,
      PatientAppointmentStatus.cancelled => context.l10n.cancelled,
    },
    style: TextStyle(
      color: status == PatientAppointmentStatus.cancelled
          ? AppColors.error
          : AppColors.success,
      fontWeight: FontWeight.w700,
    ),
  );
}
