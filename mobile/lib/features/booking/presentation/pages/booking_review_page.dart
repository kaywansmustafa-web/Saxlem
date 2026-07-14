import 'package:flutter/material.dart';
import '../../domain/entities/booking_quote.dart';
import '../booking_copy.dart';

class BookingReviewPage extends StatelessWidget {
  const BookingReviewPage({
    required this.quote,
    required this.onConfirm,
    required this.confirming,
    super.key,
  });
  final BookingQuote quote;
  final VoidCallback onConfirm;
  final bool confirming;
  @override
  Widget build(BuildContext context) {
    const copy = BookingCopy();
    final d = quote.draft;
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 18, 24, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Review appointment',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 20),
          _Summary(
            rows: [
              ('Doctor', d.doctor.displayName),
              ('Clinic', d.clinic.displayName),
              ('Date', copy.date(d.slot!.start)),
              ('Time', copy.time(d.slot!.start)),
              ('Consultation fee', copy.fee(d.clinic.consultationFeeIqd)),
              ('Estimated duration', '${d.clinic.durationMinutes} minutes'),
              ('Arrival', quote.arrivalRecommendation),
              ('Cancellation policy', d.clinic.cancellationPolicy),
            ],
          ),
          const SizedBox(height: 24),
          Semantics(
            button: true,
            liveRegion: confirming,
            label: confirming
                ? 'Confirming appointment'
                : 'Confirm appointment',
            child: FilledButton(
              onPressed: confirming ? null : onConfirm,
              child: confirming
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Confirm appointment'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.rows});
  final List<(String, String)> rows;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.all(18),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
    ),
    child: Column(
      children: rows
          .map(
            (r) => Padding(
              padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: Text(r.$1)),
                  Expanded(
                    child: Text(
                      r.$2,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    ),
  );
}
