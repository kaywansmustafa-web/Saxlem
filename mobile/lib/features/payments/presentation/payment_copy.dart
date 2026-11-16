import 'package:flutter/material.dart';
import '../../../core/localization/localization_extensions.dart';
import '../../../design_system/design_system.dart';
import '../domain/appointment_payment.dart';
import '../domain/payments_repository.dart';

String formatIqd(int value) {
  final s = value.toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return '$b IQD';
}

String paymentStatusLabel(BuildContext context, AppointmentPayment payment) {
  final l10n = context.l10n;
  return switch (payment.status) {
    PaymentStatus.dueAtCounter => l10n.paymentStatusDueAtCounter,
    PaymentStatus.pending => l10n.paymentStatusPending,
    PaymentStatus.paid => l10n.paymentStatusPaid,
    PaymentStatus.expired ||
    PaymentStatus.cancelled => l10n.paymentStatusExpired,
    PaymentStatus.refundPending => l10n.paymentStatusRefundPending,
    PaymentStatus.refunded => l10n.paymentStatusRefunded,
    PaymentStatus.refundFailed => l10n.paymentStatusRefundFailed,
    PaymentStatus.voided => l10n.paymentStatusVoid,
  };
}

SaxlemStatusTone paymentStatusTone(PaymentStatus status) => switch (status) {
  PaymentStatus.paid || PaymentStatus.refunded => SaxlemStatusTone.positive,
  PaymentStatus.pending ||
  PaymentStatus.refundPending => SaxlemStatusTone.informative,
  PaymentStatus.expired ||
  PaymentStatus.cancelled ||
  PaymentStatus.refundFailed => SaxlemStatusTone.caution,
  PaymentStatus.dueAtCounter ||
  PaymentStatus.voided => SaxlemStatusTone.neutral,
};

IconData paymentStatusIcon(PaymentStatus status) => switch (status) {
  PaymentStatus.paid => Icons.verified_rounded,
  PaymentStatus.refunded || PaymentStatus.refundPending => Icons.undo_rounded,
  PaymentStatus.pending => Icons.hourglass_top_rounded,
  PaymentStatus.dueAtCounter => Icons.storefront_rounded,
  _ => Icons.info_outline_rounded,
};

String paymentProblemCopy(BuildContext context, PaymentProblem problem) {
  final l10n = context.l10n;
  return switch (problem) {
    PaymentProblem.offline => l10n.paymentProblemOffline,
    PaymentProblem.unavailable => l10n.paymentProblemUnavailable,
    PaymentProblem.notAccepted ||
    PaymentProblem.alreadyPaid => l10n.paymentProblemNotAccepted,
    PaymentProblem.sessionExpired => l10n.sessionExpiredBody,
    PaymentProblem.unknown => l10n.paymentProblemGeneric,
  };
}

class PaymentStatusPill extends StatelessWidget {
  const PaymentStatusPill({required this.payment, super.key});
  final AppointmentPayment payment;
  @override
  Widget build(BuildContext context) => SaxlemStatusPill(
    label: paymentStatusLabel(context, payment),
    tone: paymentStatusTone(payment.status),
    icon: paymentStatusIcon(payment.status),
  );
}
