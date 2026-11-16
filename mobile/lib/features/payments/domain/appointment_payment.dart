/// How a patient pays for an appointment.
enum PaymentMethod { counter, online }

enum PaymentStatus {
  dueAtCounter,
  pending,
  paid,
  expired,
  cancelled,
  refundPending,
  refunded,
  refundFailed,
  voided;

  static PaymentStatus parse(Object? value) => switch (value) {
    'dueAtCounter' => dueAtCounter,
    'pending' => pending,
    'paid' => paid,
    'expired' => expired,
    'cancelled' => cancelled,
    'refundPending' => refundPending,
    'refunded' => refunded,
    'refundFailed' => refundFailed,
    'void' => voided,
    _ => throw const FormatException('Unknown payment status.'),
  };

  bool get isSettled =>
      this == paid ||
      this == refundPending ||
      this == refunded ||
      this == refundFailed;
}

/// Details for paying in the provider's app (FIB).
class OnlinePaymentDetails {
  const OnlinePaymentDetails({
    required this.readableCode,
    required this.qrCode,
    required this.personalAppLink,
    required this.businessAppLink,
    required this.validUntil,
  });
  final String? readableCode;

  /// PNG data URL from the provider, or null.
  final String? qrCode;
  final Uri? personalAppLink;
  final Uri? businessAppLink;
  final DateTime? validUntil;
}

class AppointmentPayment {
  const AppointmentPayment({
    required this.appointmentId,
    required this.method,
    required this.status,
    required this.amountIqd,
    required this.provider,
    required this.onlineAvailable,
    required this.online,
    required this.paidAt,
    required this.refundedAt,
    required this.version,
  });

  final String appointmentId;
  final PaymentMethod method;
  final PaymentStatus status;
  final int amountIqd;
  final String? provider;
  final bool onlineAvailable;
  final OnlinePaymentDetails? online;
  final DateTime? paidAt;
  final DateTime? refundedAt;
  final int version;

  bool get isPaid => status.isSettled;
  bool get awaitingOnline =>
      method == PaymentMethod.online && status == PaymentStatus.pending;

  /// The patient can (re)start paying in the app.
  bool get canPayOnline =>
      onlineAvailable &&
      !isPaid &&
      (method == PaymentMethod.counter ||
          status == PaymentStatus.expired ||
          status == PaymentStatus.cancelled ||
          status == PaymentStatus.pending);
}

class PaymentOptions {
  const PaymentOptions({required this.methods, required this.onlineProvider});
  final List<PaymentMethod> methods;
  final String? onlineProvider;
  bool get onlineAvailable => methods.contains(PaymentMethod.online);
  static const counterOnly = PaymentOptions(
    methods: [PaymentMethod.counter],
    onlineProvider: null,
  );
}
