import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/appointment_payment.dart';
import '../../domain/payments_repository.dart';
import '../../payments_scope.dart';
import '../pages/online_payment_page.dart';
import '../payment_copy.dart';

/// Payment status for one appointment, with "Pay now" when the clinic takes
/// online payment. Hides itself when payments are not available.
class AppointmentPaymentCard extends StatefulWidget {
  const AppointmentPaymentCard({
    required this.appointmentId,
    this.title,
    this.subtitle,
    this.repository,
    super.key,
  });
  final String appointmentId;
  final String? title, subtitle;
  final PaymentsRepository? repository;

  @override
  State<AppointmentPaymentCard> createState() => _AppointmentPaymentCardState();
}

class _AppointmentPaymentCardState extends State<AppointmentPaymentCard> {
  AppointmentPayment? payment;
  bool hidden = false;
  late PaymentsRepository repository;

  @override
  void initState() {
    super.initState();
    repository = widget.repository ?? PaymentsScope.read(context);
    _load();
  }

  Future<void> _load() async {
    try {
      final next = await repository.get(widget.appointmentId);
      if (mounted) setState(() => payment = next);
    } on PaymentFailure {
      if (mounted) setState(() => hidden = true);
    }
  }

  Future<void> _pay() async {
    final result = await OnlinePaymentPage.open(
      context,
      repository: repository,
      appointmentId: widget.appointmentId,
      title: widget.title,
      subtitle: widget.subtitle,
    );
    if (!mounted) return;
    if (result != null) setState(() => payment = result);
  }

  @override
  Widget build(BuildContext context) {
    if (hidden) return const SizedBox.shrink();
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final p = payment;
    return AnimatedSize(
      duration: SaxlemMotion.standard,
      alignment: AlignmentDirectional.topCenter,
      child: p == null
          ? const SizedBox(height: 0, width: double.infinity)
          : Container(
              padding: const EdgeInsetsDirectional.all(18),
              decoration: BoxDecoration(
                color: colors.surfaceRaised,
                borderRadius: BorderRadius.circular(SaxlemRadii.card),
                border: Border.all(color: colors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          context.l10n.paymentTitle,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      PaymentStatusPill(payment: p),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    formatIqd(p.amountIqd),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  if (!p.isPaid && p.method == PaymentMethod.counter) ...[
                    const SizedBox(height: 4),
                    Text(
                      context.l10n.paymentAtCounterBody,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                  if (p.canPayOnline) ...[
                    const SizedBox(height: 14),
                    SaxlemButton(
                      label: context.l10n.paymentPayNow,
                      leadingIcon: Icons.bolt_rounded,
                      expand: true,
                      onPressed: _pay,
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
