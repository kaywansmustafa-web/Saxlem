import 'package:flutter/material.dart';

import '../../../core/formatting/clinic_format.dart';
import '../../../core/localization/localization_extensions.dart';
import '../domain/appointment_payment.dart';
import '../domain/receipt.dart';
import 'payment_copy.dart';

String receiptWhen(BuildContext context, DateTime instant) =>
    '${ClinicFormat.clinicDay(instant, Localizations.localeOf(context).languageCode)} · ${ClinicFormat.time(instant)}';

String receiptMethod(BuildContext context, Receipt receipt) {
  final strings = context.l10n;
  return switch (receipt.method) {
    PaymentMethod.counter => strings.receiptMethodCounter,
    PaymentMethod.online when receipt.provider == 'fib' =>
      strings.receiptMethodFib,
    PaymentMethod.online => strings.receiptMethodOnline,
  };
}

String receiptPaidTo(BuildContext context, Receipt receipt) =>
    receipt.collectedBy == ReceiptCollector.platform
    ? context.l10n.receiptPaidToPlatform(receipt.organizationName)
    : receipt.organizationName;

/// The receipt's lines, in order, for the screen and for copying. `code`
/// marks values that read left to right in every language (ids, phones).
List<({String label, String value, bool code})> receiptLines(
  BuildContext context,
  Receipt receipt,
) {
  final strings = context.l10n;
  ({String label, String value, bool code}) line(
    String label,
    String value, {
    bool code = false,
  }) => (label: label, value: value, code: code);
  return [
    line(strings.receiptNumber, receipt.reference, code: true),
    line(strings.receiptPaidOn, receiptWhen(context, receipt.paidAt)),
    if (receipt.refundedAt case final refunded?)
      line(strings.receiptRefundedOn, receiptWhen(context, refunded)),
    line(strings.receiptPaidBy, receiptMethod(context, receipt)),
    if (receipt.transactionId case final id?)
      line(strings.receiptTransaction, id, code: true),
    line(strings.receiptPaidTo, receiptPaidTo(context, receipt)),
    line(strings.receiptPatient, receipt.patientName),
    line(strings.doctorLabel, receipt.doctorName),
    line(strings.receiptClinic, receipt.clinicName),
    if (receipt.clinicAddress case final address?)
      line(strings.receiptAddress, address),
    if (receipt.clinicPhone case final phone?)
      line(strings.receiptPhone, phone, code: true),
    line(strings.receiptVisit, receiptWhen(context, receipt.visitStartsAt)),
  ];
}

/// Plain text a patient can paste into a message to an employer or insurer.
String receiptText(BuildContext context, Receipt receipt) {
  final strings = context.l10n;
  return [
    strings.receiptTextHeading,
    '${strings.receiptAmount}: ${strings.iqdAmount(ClinicFormat.number(receipt.amountIqd))}',
    '${strings.receiptStatus}: ${paymentStatusText(context, receipt.status)}',
    for (final line in receiptLines(context, receipt))
      '${line.label}: ${line.value}',
  ].join('\n');
}
