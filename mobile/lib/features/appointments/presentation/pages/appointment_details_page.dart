import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../live_queue/live_queue_feature.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';

class AppointmentDetailsPage extends StatelessWidget {
  const AppointmentDetailsPage({required this.appointment, super.key});
  final PatientAppointment appointment;

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
