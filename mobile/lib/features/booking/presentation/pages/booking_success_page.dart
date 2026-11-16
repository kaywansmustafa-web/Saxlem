import 'package:flutter/material.dart';
import '../../../../design_system/design_system.dart';
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
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final date = copy.date(
      confirmation.startsAt,
      timezone: confirmation.clinicTimezone,
    );
    final time = copy.time(
      confirmation.startsAt,
      timezone: confirmation.clinicTimezone,
    );
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(20, 28, 20, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: colors.aura,
                boxShadow: SaxlemElevation.glow(colors.brandPrimary),
              ),
              child: Icon(Icons.check_rounded, size: 48, color: colors.onFill),
            ),
          ),
          const SizedBox(height: 20),
          Semantics(
            header: true,
            liveRegion: true,
            child: Text(
              context.l10n.appointmentConfirmed,
              textAlign: TextAlign.center,
              style: theme.textTheme.headlineMedium,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            context.l10n.bookingSuccessful,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: colors.surfaceRaised,
              borderRadius: BorderRadius.circular(SaxlemRadii.hero),
              border: Border.all(color: colors.border),
              boxShadow: SaxlemElevation.level2(colors.night),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsetsDirectional.all(20),
                  decoration: BoxDecoration(gradient: colors.deepAura),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        confirmation.doctorName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: colors.onFill,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        confirmation.clinicName,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colors.onFill.withValues(alpha: .88),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _Fact(label: context.l10n.date, value: date),
                          ),
                          Expanded(
                            child: _Fact(label: context.l10n.time, value: time),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Divider(height: 1, color: colors.divider),
                      const SizedBox(height: 14),
                      Text(
                        context.l10n.appointmentReferenceValue(
                          confirmation.reference,
                        ),
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: colors.textSecondary,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SaxlemButton(
            label: context.l10n.viewDoctor,
            hierarchy: SaxlemButtonHierarchy.secondary,
            expand: true,
            onPressed: onViewDoctor,
          ),
          const SizedBox(height: 8),
          SaxlemButton(
            label: context.l10n.returnHome,
            hierarchy: SaxlemButtonHierarchy.tertiary,
            expand: true,
            onPressed: onReturnHome,
          ),
        ],
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value});
  final String label, value;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelSmall),
        const SizedBox(height: 2),
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}
