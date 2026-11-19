import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/appointment_payment.dart';
import '../../domain/payments_repository.dart';

/// Drives one appointment's online payment: starts or resumes the FIB
/// payment, then checks its status every few seconds until it settles.
class OnlinePaymentController extends ChangeNotifier {
  OnlinePaymentController({
    required this.repository,
    required this.appointmentId,
    this.pollInterval = const Duration(seconds: 3),
  });
  final PaymentsRepository repository;
  final String appointmentId;
  final Duration pollInterval;

  AppointmentPayment? payment;
  PaymentProblem? problem;
  bool busy = false;
  Timer? _timer;
  bool _disposed = false;
  bool _checking = false;

  bool get isPaid => payment?.isPaid ?? false;
  bool get isWaiting => payment?.awaitingOnline ?? false;
  bool get needsNewLink =>
      payment != null &&
      payment!.method == PaymentMethod.online &&
      (payment!.status == PaymentStatus.expired ||
          payment!.status == PaymentStatus.cancelled);

  Future<void> start() =>
      _run(() => repository.choose(appointmentId, PaymentMethod.online));

  Future<void> switchToCounter() =>
      _run(() => repository.choose(appointmentId, PaymentMethod.counter));

  /// Checks now (e.g. when the patient returns from the FIB app).
  Future<void> checkNow() async {
    if (_checking || !isWaiting) return;
    _checking = true;
    try {
      final next = await repository.refresh(appointmentId);
      if (_disposed) return;
      payment = next;
      problem = null;
      _schedule();
      notifyListeners();
    } on PaymentFailure {
      // Keep polling quietly; the next tick may succeed.
    } finally {
      _checking = false;
    }
  }

  Future<void> _run(Future<AppointmentPayment> Function() action) async {
    if (busy) return;
    busy = true;
    problem = null;
    notifyListeners();
    try {
      final next = await action();
      if (_disposed) return;
      payment = next;
    } on PaymentFailure catch (failure) {
      if (_disposed) return;
      problem = failure.problem;
    }
    busy = false;
    _schedule();
    notifyListeners();
  }

  void _schedule() {
    _timer?.cancel();
    if (_disposed || !isWaiting) return;
    _timer = Timer(pollInterval, checkNow);
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    super.dispose();
  }
}
