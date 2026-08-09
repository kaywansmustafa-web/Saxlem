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

class BookingController extends ChangeNotifier {
  BookingController({
    required this.doctor,
    required this.repository,
    required this.operationIds,
    required this.profileId,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;
  final BookingDoctorReference doctor;
  final BookingRepository repository;
  final BookingOperationIdGenerator operationIds;
  final DateTime Function() _now;
  PatientProfileId profileId;
  BookingClinicOption? clinic;
  BookingAppointmentType appointmentType = BookingAppointmentType.initial;
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
    state = BookingSetup(doctor);
    notifyListeners();
  }

  void selectClinic(BookingClinicOption value) {
    clinic = value;
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
          dateTo: from.add(const Duration(days: 13)),
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
