import 'package:flutter/material.dart';
import '../../domain/entities/booking_quote.dart';
import '../booking_copy.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../../../design_system/foundations/saxlem_sizes.dart';

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
      padding: const EdgeInsetsDirectional.only(top: 18, bottom: 36),
      child: SaxlemResponsiveContent(
        maxWidth: SaxlemSizes.formMaxWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.l10n.reviewAppointment,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 20),
            _Summary(
              rows: [
                (context.l10n.viewDoctor, d.options.doctorName),
                (context.l10n.clinic, d.options.clinicName),
                (
                  context.l10n.date,
                  copy.date(
                    d.slot.startsAt,
                    timezone: d.options.clinicTimezone,
                  ),
                ),
                (
                  context.l10n.time,
                  copy.time(
                    d.slot.startsAt,
                    timezone: d.options.clinicTimezone,
                  ),
                ),
                (context.l10n.fee, copy.fee(d.options.feeIqd)),
                (
                  context.l10n.duration,
                  context.l10n.minutesLong(d.options.durationMinutes),
                ),
                (context.l10n.timezone, d.options.clinicTimezone),
                (context.l10n.appointmentReason, d.reason),
              ],
            ),
            const SizedBox(height: 24),
            Semantics(
              button: true,
              liveRegion: confirming,
              label: confirming
                  ? context.l10n.confirmingAppointment
                  : context.l10n.confirmAppointment,
              child: FilledButton(
                onPressed: confirming ? null : onConfirm,
                child: confirming
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(context.l10n.confirmAppointment),
              ),
            ),
          ],
        ),
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
