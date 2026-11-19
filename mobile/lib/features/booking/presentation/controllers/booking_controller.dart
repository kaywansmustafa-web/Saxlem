import 'package:flutter/foundation.dart';
import '../../domain/entities/appointment_slot.dart';
import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../domain/entities/booking_doctor_reference.dart';
import '../../domain/entities/booking_draft.dart';
import '../../domain/entities/booking_types.dart';
import '../../domain/entities/booking_quote.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../domain/services/booking_operation_id.dart';
import '../state/booking_state.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../payments/domain/appointment_payment.dart';
import '../../../payments/domain/payments_repository.dart';

class BookingController extends ChangeNotifier {
  BookingController({
    required this.doctor,
    required this.repository,
    required this.operationIds,
    required this.profileId,
    this.payments = const UnavailablePaymentsRepository(),
    this.daysAhead = 14,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;
  final PaymentsRepository payments;

  /// Days of times shown, today included (Owner Portal → App settings).
  final int daysAhead;

  /// Payment choice made on the review step. Counter is always possible.
  PaymentMethod paymentMethod = PaymentMethod.counter;
  PaymentOptions? paymentOptions;
  bool loadingPaymentOptions = false;
  bool get onlinePaymentAvailable => paymentOptions?.onlineAvailable ?? false;
  final BookingDoctorReference doctor;
  final BookingRepository repository;
  final BookingOperationIdGenerator operationIds;
  final DateTime Function() _now;
  PatientProfileId profileId;
  BookingClinicOption? clinic;
  late BookingAppointmentType appointmentType = doctor.followUpOnly
      ? BookingAppointmentType.followUp
      : BookingAppointmentType.initial;
  String reason = '';
  AppointmentSlot? selectedSlot;
  String? _operationId;
  BookingQuote? _attemptQuote;
  BookingProblem? _lastProblem;
  int _generation = 0;
  bool _disposed = false;

  void selectProfile(PatientProfileId value) {
    if (profileId == value) return;
    profileId = value;
    _invalidate();
  }

  BookingState state = const BookingInitial(
    BookingDoctorReference(id: '', displayName: '', clinics: []),
  );
  bool confirming = false;
  BookingAvailability? availability;
  void load() {
    // One clinic means nothing to choose: pick it so the patient never sees
    // a one-item list.
    if (clinic == null && doctor.clinics.length == 1) {
      clinic = doctor.clinics.single;
      paymentOptions = null;
      paymentMethod = PaymentMethod.counter;
    }
    state = BookingSetup(doctor);
    notifyListeners();
  }

  void selectClinic(BookingClinicOption value) {
    clinic = value;
    paymentOptions = null;
    paymentMethod = PaymentMethod.counter;
    _invalidate();
  }

  void setAppointmentType(BookingAppointmentType value) {
    if (appointmentType == value) return;
    appointmentType = value;
    _invalidate();
  }

  void setReason(String value) {
    if (reason == value) return;
    reason = value;
    _invalidate();
  }

  Future<void> loadOptions() async {
    if (clinic == null || reason.trim().isEmpty || reason.trim().length > 500) {
      state = const BookingProblemState(BookingProblem.validation);
      notifyListeners();
      return;
    }
    final generation = ++_generation;
    state = const BookingLoadingOptions();
    notifyListeners();
    final iraqNow = _now().toUtc().add(const Duration(hours: 3));
    final from = DateTime.utc(iraqNow.year, iraqNow.month, iraqNow.day);
    try {
      final result = await repository.loadOptions(
        BookingOptionsRequest(
          doctorId: doctor.id,
          clinicId: clinic!.id,
          patientProfileId: profileId.value,
          appointmentType: appointmentType,
          dateFrom: from,
          dateTo: from.add(Duration(days: daysAhead.clamp(1, 60) - 1)),
        ),
      );
      if (_disposed || generation != _generation) return;
      availability = result;
      state = result.days.every((day) => day.slots.isEmpty)
          ? BookingEmpty(result)
          : BookingOptionsReady(result);
    } on BookingFailure catch (failure) {
      if (_disposed || generation != _generation) return;
      state = BookingProblemState(failure.problem, retained: availability);
    }
    notifyListeners();
  }

  void selectSlot(AppointmentSlot slot) {
    if (availability == null) return;
    selectedSlot = slot;
    _operationId = null;
    _attemptQuote = BookingQuote(
      draft: BookingDraft(
        options: availability!,
        profileId: profileId,
        reason: reason.trim(),
        slot: slot,
      ),
    );
    state = BookingReviewing(_attemptQuote!);
    notifyListeners();
    _loadPaymentOptions(availability!.clinicId);
  }

  void setPaymentMethod(PaymentMethod value) {
    if (value == PaymentMethod.online && !onlinePaymentAvailable) return;
    if (paymentMethod == value) return;
    paymentMethod = value;
    notifyListeners();
  }

  Future<void> _loadPaymentOptions(String clinicId) async {
    if (paymentOptions != null) return;
    loadingPaymentOptions = true;
    notifyListeners();
    try {
      paymentOptions = await payments.options(clinicId);
    } on Object {
      // Without options we still offer paying at the clinic.
      paymentOptions = PaymentOptions.counterOnly;
    }
    if (_disposed) return;
    loadingPaymentOptions = false;
    if (onlinePaymentAvailable) paymentMethod = PaymentMethod.online;
    notifyListeners();
  }

  Future<void> confirm() async {
    final current = state;
    if (current is! BookingReviewing || confirming) return;
    final generation = _generation;
    confirming = true;
    state = BookingConfirming(current.quote);
    notifyListeners();
    try {
      _operationId ??= operationIds.generate();
      final confirmation = await repository.create(
        current.quote.draft,
        _operationId!,
      );
      if (_disposed || generation != _generation) {
        confirming = false;
        return;
      }
      state = BookingSuccess(confirmation);
      if (paymentMethod == PaymentMethod.counter) {
        // Record the choice; the default is already "pay at the clinic".
        Future(
          () => payments.choose(
            confirmation.appointmentId,
            PaymentMethod.counter,
          ),
        ).then((_) {}, onError: (Object _) {});
      }
      _operationId = null;
      _attemptQuote = null;
      _lastProblem = null;
    } on BookingFailure catch (failure) {
      if (_disposed || generation != _generation) {
        confirming = false;
        return;
      }
      _lastProblem = failure.problem;
      state = BookingProblemState(failure.problem, retained: availability);
      if (failure.problem == BookingProblem.conflict) {
        selectedSlot = null;
        availability = null;
        _operationId = null;
        _attemptQuote = null;
      } else if (failure.problem == BookingProblem.sessionExpired) {
        selectedSlot = null;
        availability = null;
        _operationId = null;
        _attemptQuote = null;
        state = const BookingProblemState(BookingProblem.sessionExpired);
      }
    }
    confirming = false;
    if (!_disposed) notifyListeners();
  }

  void restart() {
    if (_lastProblem == BookingProblem.unknownOutcome &&
        _attemptQuote != null) {
      state = BookingReviewing(_attemptQuote!);
      _lastProblem = null;
      notifyListeners();
      return;
    }
    availability == null ? load() : loadOptions();
  }

  void _invalidate() {
    _generation++;
    availability = null;
    selectedSlot = null;
    _operationId = null;
    _attemptQuote = null;
    _lastProblem = null;
    state = BookingSetup(doctor);
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}
