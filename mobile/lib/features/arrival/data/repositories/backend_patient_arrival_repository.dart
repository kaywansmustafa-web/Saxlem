import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/patient_arrival.dart';
import '../../domain/repositories/patient_arrival_repository.dart';
import '../dto/patient_arrival_dto.dart';

class BackendPatientArrivalRepository implements PatientArrivalRepository {
  BackendPatientArrivalRepository(this._api);
  final AuthenticatedApiClient _api;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _operation = RegExp(r'^[\x21-\x7e]{8,128}$');

  @override
  Future<PatientArrival> getArrival(String appointmentId) async {
    _validateId(appointmentId);
    try {
      return PatientArrivalDto.parse(
        (await _api.getJson('/appointments/$appointmentId/arrival')).body,
      );
    } on FormatException {
      throw const ArrivalFailure(ArrivalProblem.malformed);
    } on ApiFailure catch (e) {
      throw ArrivalFailure(_map(e, mutation: false));
    }
  }

  @override
  Future<PatientArrival> recordArrival(
    String appointmentId,
    int expectedVersion,
    String operationId,
  ) async {
    _validateId(appointmentId);
    if (expectedVersion < 1 || !_operation.hasMatch(operationId))
      throw const ArrivalFailure(ArrivalProblem.validation);
    try {
      return PatientArrivalDto.parse(
        (await _api.postJson(
          '/appointments/$appointmentId/arrival',
          body: {'version': expectedVersion},
          idempotencyKey: operationId,
        )).body,
      );
    } on FormatException {
      throw const ArrivalFailure(ArrivalProblem.malformed);
    } on MutationNotSentFailure catch (e) {
      throw ArrivalFailure(_map(e.failure, mutation: false));
    } on ApiFailure catch (e) {
      throw ArrivalFailure(_map(e, mutation: true));
    }
  }

  static void _validateId(String value) {
    if (!_uuid.hasMatch(value))
      throw const ArrivalFailure(ArrivalProblem.validation);
  }

  static ArrivalProblem _map(ApiFailure e, {required bool mutation}) =>
      switch (e.type) {
        ApiFailureType.validation =>
          e.backendCode == 'ARRIVAL_NOT_ELIGIBLE'
              ? ArrivalProblem.ineligible
              : ArrivalProblem.validation,
        ApiFailureType.unauthenticated => ArrivalProblem.sessionExpired,
        ApiFailureType.forbidden => ArrivalProblem.forbidden,
        ApiFailureType.notFound => ArrivalProblem.notFound,
        ApiFailureType.conflict => ArrivalProblem.conflict,
        ApiFailureType.offline =>
          mutation ? ArrivalProblem.unknownOutcome : ArrivalProblem.offline,
        ApiFailureType.timeout =>
          mutation ? ArrivalProblem.unknownOutcome : ArrivalProblem.timeout,
        ApiFailureType.malformedResponse => ArrivalProblem.malformed,
        ApiFailureType.server || ApiFailureType.unavailable =>
          mutation ? ArrivalProblem.unknownOutcome : ArrivalProblem.unavailable,
        _ => ArrivalProblem.unknown,
      };
}

class UnavailablePatientArrivalRepository implements PatientArrivalRepository {
  const UnavailablePatientArrivalRepository();
  Never _fail() => throw const ArrivalFailure(ArrivalProblem.unavailable);
  @override
  Future<PatientArrival> getArrival(String appointmentId) async => _fail();
  @override
  Future<PatientArrival> recordArrival(
    String appointmentId,
    int expectedVersion,
    String operationId,
  ) async => _fail();
}

// ignore_for_file: curly_braces_in_flow_control_structures
