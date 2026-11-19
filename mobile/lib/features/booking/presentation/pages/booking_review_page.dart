import 'package:flutter/material.dart';
import '../../domain/entities/booking_quote.dart';
import '../booking_copy.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../../payments/domain/appointment_payment.dart';
import '../../../payments/presentation/widgets/payment_method_selector.dart';

class BookingReviewPage extends StatelessWidget {
  const BookingReviewPage({
    required this.quote,
    required this.onConfirm,
    required this.confirming,
    this.paymentMethod = PaymentMethod.counter,
    this.onlinePaymentAvailable = false,
    this.loadingPaymentOptions = false,
    this.onPaymentMethodChanged,
    super.key,
  });
  final BookingQuote quote;
  final VoidCallback onConfirm;
  final bool confirming;
  final PaymentMethod paymentMethod;
  final bool onlinePaymentAvailable, loadingPaymentOptions;
  final ValueChanged<PaymentMethod>? onPaymentMethodChanged;

  @override
  Widget build(BuildContext context) {
    const copy = BookingCopy();
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final d = quote.draft;
    final payOnline = paymentMethod == PaymentMethod.online;
    final confirmLabel = payOnline
        ? context.l10n.paymentConfirmAndPay
        : context.l10n.confirmAppointment;
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.only(top: 18, bottom: 36),
      child: SaxlemResponsiveContent(
        maxWidth: SaxlemSizes.formMaxWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.l10n.reviewAppointment,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: colors.surfaceRaised,
                borderRadius: BorderRadius.circular(SaxlemRadii.hero),
                border: Border.all(color: colors.border),
                boxShadow: colors.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsetsDirectional.fromSTEB(
                      20,
                      18,
                      20,
                      18,
                    ),
                    decoration: BoxDecoration(gradient: colors.deepAura),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                d.options.doctorName,
                                style: theme.textTheme.titleLarge?.copyWith(
                                  color: colors.onFill,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                d.options.clinicName,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: colors.onFill.withValues(alpha: .88),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              copy.time(
                                d.slot.startsAt,
                                timezone: d.options.clinicTimezone,
                              ),
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: colors.onFill,
                                fontWeight: FontWeight.w700,
                                fontFeatures: const [
                                  FontFeature.tabularFigures(),
                                ],
                              ),
                            ),
                            Text(
                              copy.date(
                                d.slot.startsAt,
                                timezone: d.options.clinicTimezone,
                                languageCode: Localizations.localeOf(
                                  context,
                                ).languageCode,
                              ),
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: colors.onFill.withValues(alpha: .88),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(
                      20,
                      8,
                      20,
                      12,
                    ),
                    child: Column(
                      children: [
                        _Row(
                          icon: Icons.schedule_rounded,
                          label: context.l10n.duration,
                          value: context.l10n.minutesLong(
                            d.options.durationMinutes,
                          ),
                        ),
                        _Row(
                          icon: Icons.notes_rounded,
                          label: context.l10n.appointmentReason,
                          value: d.reason,
                        ),
                        _Row(
                          icon: Icons.payments_outlined,
                          label: context.l10n.fee,
                          value: copy.fee(d.options.feeIqd),
                          emphasize: true,
                          last: true,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            PaymentMethodSelector(
              selected: paymentMethod,
              onlineAvailable: onlinePaymentAvailable,
              loading: loadingPaymentOptions,
              onChanged: confirming
                  ? (_) {}
                  : (onPaymentMethodChanged ?? (_) {}),
            ),
            const SizedBox(height: 24),
            Semantics(
              button: true,
              liveRegion: confirming,
              label: confirming
                  ? context.l10n.confirmingAppointment
                  : confirmLabel,
              excludeSemantics: true,
              child: SaxlemButton(
                label: confirmLabel,
                leadingIcon: payOnline
                    ? Icons.bolt_rounded
                    : Icons.check_rounded,
                expand: true,
                loading: confirming,
                onPressed: loadingPaymentOptions ? null : onConfirm,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.icon,
    required this.label,
    required this.value,
    this.emphasize = false,
    this.last = false,
  });
  final IconData icon;
  final String label, value;
  final bool emphasize, last;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsetsDirectional.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: last ? null : Border(bottom: BorderSide(color: colors.divider)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colors.textMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            flex: 2,
            child: Text(
              value,
              textAlign: TextAlign.end,
              style:
                  (emphasize
                          ? theme.textTheme.titleMedium
                          : theme.textTheme.bodyMedium)
                      ?.copyWith(
                        fontWeight: FontWeight.w700,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
            ),
          ),
        ],
      ),
    );
  }
}
