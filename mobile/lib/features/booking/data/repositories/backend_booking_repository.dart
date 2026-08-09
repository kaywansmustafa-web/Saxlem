import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../../domain/entities/booking_draft.dart';
import '../../domain/entities/booking_types.dart';
import '../../domain/repositories/booking_repository.dart';
import '../dto/appointment_response_dto.dart';
import '../dto/booking_options_response_dto.dart';

class BackendBookingRepository implements BookingRepository {
  BackendBookingRepository(this._api);
  final AuthenticatedApiClient _api;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );

  @override
  Future<BookingAvailability> loadOptions(BookingOptionsRequest request) async {
    _uuidValue(request.doctorId);
    _uuidValue(request.clinicId);
    _uuidValue(request.patientProfileId);
    final fromDate = DateTime.utc(
      request.dateFrom.year,
      request.dateFrom.month,
      request.dateFrom.day,
    );
    final toDate = DateTime.utc(
      request.dateTo.year,
      request.dateTo.month,
      request.dateTo.day,
    );
    final from = _date(fromDate);
    final to = _date(toDate);
    if (toDate.isBefore(fromDate) || toDate.difference(fromDate).inDays >= 31) {
      throw const BookingFailure(BookingProblem.validation);
    }
    try {
      final response = await _api.getJson(
        '/doctors/${request.doctorId}/booking-options',
        queryParameters: {
          'clinicId': request.clinicId,
          'patientProfileId': request.patientProfileId,
          'appointmentType': request.appointmentType.name,
          'dateFrom': from,
          'dateTo': to,
        },
      );
      final options = BookingOptionsResponseDto.parse(response.body);
      if (options.doctorId != request.doctorId ||
          options.clinicId != request.clinicId ||
          options.appointmentType != request.appointmentType ||
          options.dateFrom != fromDate ||
          options.dateTo != toDate) {
        throw const FormatException('Invalid booking options response.');
      }
      return options;
    } on FormatException {
      throw const BookingFailure(BookingProblem.malformedResponse);
    } on MutationNotSentFailure catch (failure) {
      throw BookingFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw BookingFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<BookingConfirmation> create(
    BookingDraft draft,
    String operationId,
  ) async {
    if (!RegExp(r'^[\x21-\x7e]{8,128}$').hasMatch(operationId) ||
        draft.reason.trim().isEmpty ||
        draft.reason.trim().length > 500) {
      throw const BookingFailure(BookingProblem.validation);
    }
    _uuidValue(draft.options.organizationId);
    _uuidValue(draft.options.clinicId);
    _uuidValue(draft.options.doctorId);
    _uuidValue(draft.profileId.value);
    final authoritativeSlot = draft.options.days
        .expand((day) => day.slots)
        .any(
          (slot) =>
              slot.startsAt.isAtSameMomentAs(draft.slot.startsAt) &&
              slot.endsAt.isAtSameMomentAs(draft.slot.endsAt) &&
              slot.durationMinutes == draft.slot.durationMinutes,
        );
    if (!authoritativeSlot ||
        draft.slot.durationMinutes != draft.options.durationMinutes) {
      throw const BookingFailure(BookingProblem.validation);
    }
    try {
      final response = await _api.postJson(
        '/appointments',
        idempotencyKey: operationId,
        body: {
          'organizationId': draft.options.organizationId,
          'clinicId': draft.options.clinicId,
          'doctorId': draft.options.doctorId,
          'patientProfileId': draft.profileId.value,
          'type': draft.options.appointmentType.name,
          'reason': draft.reason.trim(),
          'startsAt': draft.slot.startsAt.toUtc().toIso8601String(),
          'durationMinutes': draft.options.durationMinutes,
        },
      );
      final confirmation = AppointmentResponseDto.parse(
        response.body,
        clinicTimezone: draft.options.clinicTimezone,
      );
      if (confirmation.clinicId != draft.options.clinicId ||
          confirmation.doctorId != draft.options.doctorId ||
          confirmation.patientProfileId != draft.profileId.value ||
          !confirmation.startsAt.isAtSameMomentAs(draft.slot.startsAt) ||
          confirmation.durationMinutes != draft.options.durationMinutes) {
        throw const FormatException('Invalid appointment response.');
      }
      return confirmation;
    } on FormatException {
      throw const BookingFailure(BookingProblem.malformedResponse);
    } on MutationNotSentFailure catch (failure) {
      throw BookingFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw BookingFailure(_problem(failure, mutation: true));
    }
  }

  static BookingProblem _problem(ApiFailure failure, {required bool mutation}) {
    return switch (failure.type) {
      ApiFailureType.offline ||
      ApiFailureType.timeout when mutation => BookingProblem.unknownOutcome,
      ApiFailureType.offline => BookingProblem.offline,
      ApiFailureType.timeout => BookingProblem.timeout,
      ApiFailureType.unauthenticated => BookingProblem.sessionExpired,
      ApiFailureType.forbidden => BookingProblem.forbidden,
      ApiFailureType.validation => BookingProblem.validation,
      ApiFailureType.conflict => BookingProblem.conflict,
      ApiFailureType.malformedResponse => BookingProblem.malformedResponse,
      ApiFailureType.unavailable || ApiFailureType.server =>
        mutation
            ? BookingProblem.unknownOutcome
            : BookingProblem.backendUnavailable,
      _ => BookingProblem.unknown,
    };
  }

  static void _uuidValue(String value) {
    if (!_uuid.hasMatch(value)) {
      throw const BookingFailure(BookingProblem.validation);
    }
  }

  static String _date(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
}

class UnavailableBookingRepository implements BookingRepository {
  const UnavailableBookingRepository();
  @override
  Future<BookingConfirmation> create(BookingDraft draft, String operationId) =>
      throw const BookingFailure(BookingProblem.backendUnavailable);
  @override
  Future<BookingAvailability> loadOptions(BookingOptionsRequest request) =>
      throw const BookingFailure(BookingProblem.backendUnavailable);
}
