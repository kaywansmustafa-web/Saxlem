import '../../../../core/models/patient_profile.dart';
import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../dto/patient_appointment_dto.dart';

class BackendPatientAppointmentsRepository
    implements PatientAppointmentsRepository {
  BackendPatientAppointmentsRepository(this._api);
  final AuthenticatedApiClient _api;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _cursor = RegExp(r'^[\x21-\x7e]{1,1024}$');

  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async {
    _uuidValue(request.profileId.value);
    if (request.pageSize < 1 ||
        request.pageSize > 50 ||
        request.cursor != null && !_cursor.hasMatch(request.cursor!) ||
        !request.to.isAfter(request.from) ||
        request.to.difference(request.from) > const Duration(days: 366)) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
    try {
      final response = await _api.getJson(
        '/appointments',
        queryParameters: {
          'patientProfileId': request.profileId.value,
          'from': request.from.toUtc().toIso8601String(),
          'to': request.to.toUtc().toIso8601String(),
          'pageSize': request.pageSize.toString(),
          'status': request.status.name,
          'cursor': ?request.cursor,
        },
      );
      final page = PatientAppointmentDto.parsePage(response.body);
      if (page.items.any(
        (item) =>
            item.profileId != request.profileId ||
            item.status != request.status ||
            item.startsAt.isBefore(request.from) ||
            !item.startsAt.isBefore(request.to),
      )) {
        throw const FormatException();
      }
      return page;
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<PatientAppointment> detail(
    String appointmentId,
    PatientProfileId profileId,
  ) async {
    _uuidValue(appointmentId);
    _uuidValue(profileId.value);
    try {
      final response = await _api.getJson('/appointments/$appointmentId');
      final item = PatientAppointmentDto.parse(response.body);
      if (item.id != appointmentId || item.profileId != profileId) {
        throw const FormatException();
      }
      return item;
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String operationId,
  ) async {
    final reason = command.reason.trim();
    final item = await _mutation(
      appointmentId: command.appointmentId,
      profileId: command.profileId,
      operationId: operationId,
      path: '/appointments/${command.appointmentId}/cancel',
      body: {'reason': reason, 'version': command.version},
    );
    if (item.status != PatientAppointmentStatus.cancelled ||
        item.cancellationReason != reason ||
        item.version <= command.version) {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    }
    return item;
  }

  @override
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String operationId,
  ) async {
    final item = await _mutation(
      appointmentId: command.appointmentId,
      profileId: command.profileId,
      operationId: operationId,
      path: '/appointments/${command.appointmentId}/reschedule',
      body: {
        'startsAt': command.startsAt.toUtc().toIso8601String(),
        'durationMinutes': command.durationMinutes,
        'version': command.version,
      },
    );
    if (!item.startsAt.isAtSameMomentAs(command.startsAt) ||
        item.durationMinutes != command.durationMinutes ||
        item.version <= command.version) {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    }
    return item;
  }

  Future<PatientAppointment> _mutation({
    required String appointmentId,
    required PatientProfileId profileId,
    required String operationId,
    required String path,
    required Map<String, Object?> body,
  }) async {
    _uuidValue(appointmentId);
    _uuidValue(profileId.value);
    final reason = body['reason'];
    if (!RegExp(r'^[\x21-\x7e]{8,128}$').hasMatch(operationId) ||
        body['version'] is! int ||
        (body['version'] as int) < 1 ||
        reason != null &&
            (reason is! String || reason.isEmpty || reason.length > 500)) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
    try {
      final response = await _api.postJson(
        path,
        body: body,
        idempotencyKey: operationId,
      );
      final item = PatientAppointmentDto.parse(response.body);
      if (item.id != appointmentId || item.profileId != profileId) {
        throw const FormatException();
      }
      return item;
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on MutationNotSentFailure catch (failure) {
      throw AppointmentFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: true));
    }
  }

  static AppointmentProblem _problem(
    ApiFailure failure, {
    required bool mutation,
  }) => switch (failure.type) {
    ApiFailureType.offline ||
    ApiFailureType.timeout when mutation => AppointmentProblem.unknownOutcome,
    ApiFailureType.offline => AppointmentProblem.offline,
    ApiFailureType.timeout => AppointmentProblem.timeout,
    ApiFailureType.unauthenticated => AppointmentProblem.sessionExpired,
    ApiFailureType.forbidden => AppointmentProblem.forbidden,
    ApiFailureType.notFound => AppointmentProblem.notFound,
    ApiFailureType.conflict => AppointmentProblem.conflict,
    ApiFailureType.validation => AppointmentProblem.validation,
    ApiFailureType.malformedResponse => AppointmentProblem.malformed,
    ApiFailureType.unavailable || ApiFailureType.server =>
      mutation
          ? AppointmentProblem.unknownOutcome
          : AppointmentProblem.unavailable,
    _ => AppointmentProblem.unknown,
  };

  static void _uuidValue(String value) {
    if (!_uuid.hasMatch(value)) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
  }
}

class UnavailablePatientAppointmentsRepository
    implements PatientAppointmentsRepository {
  const UnavailablePatientAppointmentsRepository();
  Never _unavailable() =>
      throw const AppointmentFailure(AppointmentProblem.unavailable);
  @override
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String operationId,
  ) async => _unavailable();
  @override
  Future<PatientAppointment> detail(
    String appointmentId,
    PatientProfileId profileId,
  ) async => _unavailable();
  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async =>
      _unavailable();
  @override
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String operationId,
  ) async => _unavailable();
}
