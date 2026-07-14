import 'package:flutter/material.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../booking_copy.dart';

class BookingSuccessPage extends StatelessWidget {
  const BookingSuccessPage({
    required this.confirmation,
    required this.onViewDoctor,
    required this.onReturnHome,
    super.key,
  });
  final BookingConfirmation confirmation;
  final VoidCallback onViewDoctor, onReturnHome;
  @override
  Widget build(BuildContext context) {
    const copy = BookingCopy();
    final d = confirmation.quote.draft;
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 32, 24, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(
            Icons.check_circle_rounded,
            size: 76,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 20),
          Text(
            'Appointment confirmed',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(confirmation.nextStep, textAlign: TextAlign.center),
          const SizedBox(height: 26),
          Container(
            padding: const EdgeInsetsDirectional.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Appointment ID ${confirmation.mockAppointmentId}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const Divider(height: 28),
                Text(d.doctor.displayName),
                Text(d.clinic.displayName),
                Text(
                  '${copy.date(d.slot!.start)} · ${copy.time(d.slot!.start)}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: onViewDoctor,
            child: const Text('View Doctor'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: onReturnHome,
            child: const Text('Return Home'),
          ),
        ],
      ),
    );
  }
}
