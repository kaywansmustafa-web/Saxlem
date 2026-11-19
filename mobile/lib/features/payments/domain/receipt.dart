import 'appointment_payment.dart';

/// Who took the money for an online payment.
enum ReceiptCollector { platform, organization }

/// What a patient paid for one visit, for their records or an employer.
class Receipt {
  const Receipt({
    required this.id,
    required this.appointmentId,
    required this.reference,
    required this.patientName,
    required this.doctorName,
    required this.clinicName,
    required this.clinicAddress,
    required this.clinicPhone,
    required this.organizationName,
    required this.visitStartsAt,
    required this.method,
    required this.provider,
    required this.transactionId,
    required this.collectedBy,
    required this.amountIqd,
    required this.status,
    required this.paidAt,
    required this.refundedAt,
  });
  final String id, appointmentId, reference, patientName, doctorName;
  final String clinicName, organizationName;
  final String? clinicAddress, clinicPhone, provider, transactionId;
  final DateTime visitStartsAt, paidAt;
  final DateTime? refundedAt;
  final PaymentMethod method;
  final ReceiptCollector? collectedBy;
  final int amountIqd;

  /// Always a settled status: paid, or a refund in some state.
  final PaymentStatus status;
}

class ReceiptList {
  const ReceiptList({required this.items, required this.nextCursor});
  final List<Receipt> items;
  final String? nextCursor;
}

/// Payment history for the app account: every visit any of its profiles paid.
abstract interface class ReceiptsSource {
  Future<ReceiptList> receipts({String? cursor});

  /// Throws [PaymentFailure] with [PaymentProblem.unknown] when the visit
  /// has no receipt (not paid yet).
  Future<Receipt> receipt(String appointmentId);
}
