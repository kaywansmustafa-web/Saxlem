import 'package:flutter/material.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../booking_copy.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../payments/domain/appointment_payment.dart';
import '../../../payments/domain/payments_repository.dart';
import '../../../payments/presentation/pages/online_payment_page.dart';
import '../../../payments/presentation/payment_copy.dart';

class BookingSuccessPage extends StatefulWidget {
  const BookingSuccessPage({
    required this.confirmation,
    required this.onViewDoctor,
    required this.onReturnHome,
    this.paymentMethod = PaymentMethod.counter,
    this.payments = const UnavailablePaymentsRepository(),
    super.key,
  });
  final BookingConfirmation confirmation;
  final VoidCallback onViewDoctor, onReturnHome;
  final PaymentMethod paymentMethod;
  final PaymentsRepository payments;

  @override
  State<BookingSuccessPage> createState() => _BookingSuccessPageState();
}

class _BookingSuccessPageState extends State<BookingSuccessPage> {
  AppointmentPayment? payment;

  @override
  void initState() {
    super.initState();
    if (widget.paymentMethod == PaymentMethod.online) {
      // Go straight to paying; the booking is already safe.
      WidgetsBinding.instance.addPostFrameCallback((_) => _pay());
    }
  }

  Future<void> _pay() async {
    if (!mounted) return;
    final result = await OnlinePaymentPage.open(
      context,
      repository: widget.payments,
      appointmentId: widget.confirmation.appointmentId,
      title: widget.confirmation.doctorName,
      subtitle: widget.confirmation.clinicName,
    );
    if (mounted && result != null) setState(() => payment = result);
  }

  bool get _showPayNow =>
      widget.paymentMethod == PaymentMethod.online &&
      !(payment?.isPaid ?? false) &&
      payment?.method != PaymentMethod.counter;

  @override
  Widget build(BuildContext context) {
    final confirmation = widget.confirmation;
    final onViewDoctor = widget.onViewDoctor;
    final onReturnHome = widget.onReturnHome;
    const copy = BookingCopy();
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final date = copy.date(
      confirmation.startsAt,
      timezone: confirmation.clinicTimezone,
      languageCode: Localizations.localeOf(context).languageCode,
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
          const SizedBox(height: 16),
          _PaymentSummary(
            amount: confirmation.feeIqd,
            payment: payment,
            chosenOnline: widget.paymentMethod == PaymentMethod.online,
          ),
          const SizedBox(height: 24),
          if (_showPayNow) ...[
            SaxlemButton(
              label: context.l10n.paymentPayNow,
              leadingIcon: Icons.bolt_rounded,
              expand: true,
              onPressed: _pay,
            ),
            const SizedBox(height: 8),
          ],
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

class _PaymentSummary extends StatelessWidget {
  const _PaymentSummary({
    required this.amount,
    required this.payment,
    required this.chosenOnline,
  });
  final int amount;
  final AppointmentPayment? payment;
  final bool chosenOnline;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final paid = payment?.isPaid ?? false;
    final atCounter =
        payment?.method == PaymentMethod.counter ||
        (payment == null && !chosenOnline);
    final (icon, title, tone) = paid
        ? (
            Icons.verified_rounded,
            context.l10n.paymentStatusPaid,
            colors.positiveContent,
          )
        : atCounter
        ? (
            Icons.storefront_rounded,
            context.l10n.paymentAtCounterTitle,
            colors.textSecondary,
          )
        : (
            Icons.hourglass_top_rounded,
            context.l10n.paymentStatusPending,
            colors.brandPrimary,
          );
    return AnimatedContainer(
      duration: SaxlemMotion.standard,
      padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: paid ? colors.positiveSurface : colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.card),
        border: Border.all(color: paid ? Colors.transparent : colors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: tone),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: paid ? colors.positiveContent : null,
                  ),
                ),
                if (atCounter && !paid)
                  Text(
                    context.l10n.paymentAtCounterBody,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          Text(
            formatIqd(amount),
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}
