import 'package:flutter/material.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../booking_copy.dart';
import '../../../../core/localization/localization_extensions.dart';

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
            context.l10n.appointmentConfirmed,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(context.l10n.bookingSuccessful, textAlign: TextAlign.center),
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
                  context.l10n.appointmentReferenceValue(
                    confirmation.reference,
                  ),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const Divider(height: 28),
                Text(confirmation.doctorName),
                Text(confirmation.clinicName),
                Text(
                  '${copy.date(confirmation.startsAt, timezone: confirmation.clinicTimezone)} · '
                  '${copy.time(confirmation.startsAt, timezone: confirmation.clinicTimezone)}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: onViewDoctor,
            child: Text(context.l10n.viewDoctor),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: onReturnHome,
            child: Text(context.l10n.returnHome),
          ),
        ],
      ),
    );
  }
}
