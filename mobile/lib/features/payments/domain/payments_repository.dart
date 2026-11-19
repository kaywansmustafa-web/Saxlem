import 'appointment_payment.dart';

enum PaymentProblem {
  offline,
  unavailable,
  sessionExpired,
  alreadyPaid,
  notAccepted,
  unknown,
}

class PaymentFailure implements Exception {
  const PaymentFailure(this.problem);
  final PaymentProblem problem;
  @override
  String toString() => 'PaymentFailure(${problem.name})';
}

abstract interface class PaymentsRepository {
  Future<PaymentOptions> options(String clinicId);
  Future<AppointmentPayment> get(String appointmentId);
  Future<AppointmentPayment> choose(String appointmentId, PaymentMethod method);
  Future<AppointmentPayment> refresh(String appointmentId);
}

/// Used when payments are not wired (mock mode, tests): counter only.
class UnavailablePaymentsRepository implements PaymentsRepository {
  const UnavailablePaymentsRepository();
  @override
  Future<PaymentOptions> options(String clinicId) async =>
      PaymentOptions.counterOnly;
  @override
  Future<AppointmentPayment> get(String appointmentId) async =>
      throw const PaymentFailure(PaymentProblem.unavailable);
  @override
  Future<AppointmentPayment> choose(
    String appointmentId,
    PaymentMethod method,
  ) async => throw const PaymentFailure(PaymentProblem.unavailable);
  @override
  Future<AppointmentPayment> refresh(String appointmentId) async =>
      throw const PaymentFailure(PaymentProblem.unavailable);
}
