import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/patient_appointment.dart';

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
      appBar: AppBar(title: const Text('Appointment Details')),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 20, 24, 36),
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
                  _Row('Clinic', appointment.clinicName),
                  _Row(
                    'Date',
                    localizations.formatMediumDate(appointment.scheduledAt),
                  ),
                  _Row(
                    'Time',
                    localizations.formatTimeOfDay(
                      TimeOfDay.fromDateTime(appointment.scheduledAt),
                    ),
                  ),
                  _Row('Status', appointment.status.name),
                  _Row('Fee', '${appointment.feeIqd} IQD'),
                  _Row('Duration', '${appointment.durationMinutes} minutes'),
                  _Row('Appointment ID', appointment.id),
                ],
              ),
              const SizedBox(height: 18),
              Semantics(
                liveRegion: true,
                child: Text(
                  today
                      ? 'Live Queue is available for today’s appointment.'
                      : 'Queue opens on appointment day.',
                ),
              ),
              if (today) ...[
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: appointment.queueEntryId == null ? null : () {},
                  child: const Text('Open Live Queue'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
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
