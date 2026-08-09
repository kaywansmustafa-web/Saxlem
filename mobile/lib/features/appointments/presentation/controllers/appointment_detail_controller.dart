import 'package:flutter/foundation.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../booking/domain/entities/appointment_slot.dart';
import '../../../booking/domain/entities/booking_types.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../booking/domain/services/booking_operation_id.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../state/appointment_detail_state.dart';

class AppointmentDetailController extends ChangeNotifier {
  AppointmentDetailController({
    required this.appointmentId,
    required this.profileId,
    required this.repository,
    required this.bookingRepository,
    required this.operationIds,
    required this.onChanged,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final String appointmentId;
  PatientProfileId profileId;
  final PatientAppointmentsRepository repository;
  final BookingRepository bookingRepository;
  final BookingOperationIdGenerator operationIds;
  final Future<void> Function() onChanged;
  final DateTime Function() _now;
  AppointmentDetailState state = const AppointmentDetailLoading();
  int _generation = 0;
  bool _disposed = false;
  String? _cancelKey, _cancelFingerprint;
  String? _rescheduleKey, _rescheduleFingerprint;

  Future<void> load() async {
    final generation = ++_generation;
    state = const AppointmentDetailLoading();
    notifyListeners();
    try {
      final item = await repository.detail(appointmentId, profileId);
      if (_disposed || generation != _generation) return;
      state = AppointmentDetailReady(item);
    } on AppointmentFailure catch (failure) {
      if (_disposed || generation != _generation) return;
      state = AppointmentDetailFailure(failure.problem);
    }
    if (!_disposed) notifyListeners();
  }

  void changeProfile(PatientProfileId value) {
    if (profileId == value) return;
    profileId = value;
    _clearAttempts();
    load();
  }

  Future<void> cancel(String reason) async {
    final current = state;
    if (current is! AppointmentDetailReady ||
        current.submitting ||
        !current.appointment.canMutate) {
      return;
    }
    final normalized = reason.trim();
    if (normalized.isEmpty || normalized.length > 500) {
      state = AppointmentDetailReady(
        current.appointment,
        problem: AppointmentProblem.validation,
        availability: current.availability,
      );
      notifyListeners();
      return;
    }
    final fingerprint = '${current.appointment.version}:$normalized';
    if (_cancelFingerprint != fingerprint) {
      _cancelFingerprint = fingerprint;
      _cancelKey = operationIds.generate();
    }
    state = AppointmentDetailReady(
      current.appointment,
      submitting: true,
      availability: current.availability,
    );
    notifyListeners();
    await _mutate(
      () => repository.cancel(
        AppointmentCancellation(
          appointmentId: appointmentId,
          profileId: profileId,
          reason: normalized,
          version: current.appointment.version,
        ),
        _cancelKey!,
      ),
      current,
      cancellation: true,
    );
  }

  Future<void> loadRescheduleOptions() async {
    final current = state;
    if (current is! AppointmentDetailReady || !current.appointment.canMutate) {
      return;
    }
    final generation = _generation;
    state = AppointmentDetailReady(
      current.appointment,
      availability: current.availability,
      loadingAvailability: true,
    );
    notifyListeners();
    final iraqNow = _now().toUtc().add(const Duration(hours: 3));
    final from = DateTime.utc(iraqNow.year, iraqNow.month, iraqNow.day);
    try {
      final options = await bookingRepository.loadOptions(
        BookingOptionsRequest(
          doctorId: current.appointment.doctor.id,
          clinicId: current.appointment.clinicId,
          patientProfileId: profileId.value,
          appointmentType:
              current.appointment.type == PatientAppointmentType.initial
              ? BookingAppointmentType.initial
              : BookingAppointmentType.followUp,
          dateFrom: from,
          dateTo: from.add(const Duration(days: 13)),
        ),
      );
      if (_disposed || generation != _generation) return;
      state = AppointmentDetailReady(
        current.appointment,
        availability: options,
      );
    } on BookingFailure catch (failure) {
      if (_disposed || generation != _generation) return;
      state = AppointmentDetailReady(
        current.appointment,
        problem: _bookingProblem(failure.problem),
      );
    }
    if (!_disposed) notifyListeners();
  }

  Future<void> reschedule(AppointmentSlot slot) async {
    final current = state;
    if (current is! AppointmentDetailReady ||
        current.submitting ||
        current.availability == null ||
        !current.appointment.canMutate ||
        !current.availability!.days
            .expand((day) => day.slots)
            .any(
              (item) =>
                  item.startsAt.isAtSameMomentAs(slot.startsAt) &&
                  item.durationMinutes == slot.durationMinutes,
            )) {
      return;
    }
    final fingerprint =
        '${current.appointment.version}:${slot.startsAt.toUtc().toIso8601String()}:${slot.durationMinutes}';
    if (_rescheduleFingerprint != fingerprint) {
      _rescheduleFingerprint = fingerprint;
      _rescheduleKey = operationIds.generate();
    }
    state = AppointmentDetailReady(
      current.appointment,
      submitting: true,
      availability: current.availability,
    );
    notifyListeners();
    await _mutate(
      () => repository.reschedule(
        AppointmentReschedule(
          appointmentId: appointmentId,
          profileId: profileId,
          startsAt: slot.startsAt,
          durationMinutes: slot.durationMinutes,
          version: current.appointment.version,
        ),
        _rescheduleKey!,
      ),
      current,
      cancellation: false,
    );
  }

  Future<void> _mutate(
    Future<PatientAppointment> Function() command,
    AppointmentDetailReady previous, {
    required bool cancellation,
  }) async {
    final generation = _generation;
    try {
      final item = await command();
      if (_disposed || generation != _generation) return;
      _clearAttempts();
      state = AppointmentDetailReady(item);
      await onChanged();
    } on AppointmentFailure catch (failure) {
      if (_disposed || generation != _generation) return;
      if (failure.problem == AppointmentProblem.conflict) {
        if (cancellation) {
          _cancelKey = null;
          _cancelFingerprint = null;
        } else {
          _rescheduleKey = null;
          _rescheduleFingerprint = null;
        }
        await load();
        if (!cancellation && state is AppointmentDetailReady) {
          await loadRescheduleOptions();
        }
        return;
      }
      state = AppointmentDetailReady(
        previous.appointment,
        problem: failure.problem,
        availability: previous.availability,
      );
    }
    if (!_disposed) notifyListeners();
  }

  static AppointmentProblem _bookingProblem(BookingProblem problem) =>
      switch (problem) {
        BookingProblem.offline => AppointmentProblem.offline,
        BookingProblem.timeout => AppointmentProblem.timeout,
        BookingProblem.forbidden => AppointmentProblem.forbidden,
        BookingProblem.sessionExpired => AppointmentProblem.sessionExpired,
        BookingProblem.malformedResponse => AppointmentProblem.malformed,
        BookingProblem.conflict => AppointmentProblem.conflict,
        BookingProblem.validation => AppointmentProblem.validation,
        BookingProblem.backendUnavailable => AppointmentProblem.unavailable,
        BookingProblem.unknownOutcome => AppointmentProblem.unknownOutcome,
        BookingProblem.unknown => AppointmentProblem.unknown,
      };

  void _clearAttempts() {
    _cancelKey = null;
    _cancelFingerprint = null;
    _rescheduleKey = null;
    _rescheduleFingerprint = null;
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}
