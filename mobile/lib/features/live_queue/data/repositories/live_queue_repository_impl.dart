import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/patient_queue_status.dart';
import '../../domain/repositories/live_queue_repository.dart';
import '../dto/patient_queue_status_dto.dart';

class BackendLiveQueueRepository implements LiveQueueRepository {
  BackendLiveQueueRepository(this._api);
  final AuthenticatedApiClient _api;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  @override
  Future<PatientQueueStatus> getQueueStatus(String appointmentId) async {
    if (!_uuid.hasMatch(appointmentId))
      throw const LiveQueueFailure(LiveQueueProblem.validation);
    try {
      return PatientQueueStatusDto.parse(
        appointmentId,
        (await _api.getJson('/appointments/$appointmentId/queue-status')).body,
      );
    } on FormatException {
      throw const LiveQueueFailure(LiveQueueProblem.malformed);
    } on ApiFailure catch (e) {
      throw LiveQueueFailure(switch (e.type) {
        ApiFailureType.unauthenticated => LiveQueueProblem.sessionExpired,
        ApiFailureType.forbidden => LiveQueueProblem.forbidden,
        ApiFailureType.notFound => LiveQueueProblem.notFound,
        ApiFailureType.offline => LiveQueueProblem.offline,
        ApiFailureType.timeout => LiveQueueProblem.timeout,
        ApiFailureType.malformedResponse => LiveQueueProblem.malformed,
        ApiFailureType.server ||
        ApiFailureType.unavailable => LiveQueueProblem.unavailable,
        _ => LiveQueueProblem.unknown,
      });
    }
  }
}

class UnavailableLiveQueueRepository implements LiveQueueRepository {
  const UnavailableLiveQueueRepository();
  @override
  Future<PatientQueueStatus> getQueueStatus(String appointmentId) async =>
      throw const LiveQueueFailure(LiveQueueProblem.unavailable);
}

// ignore_for_file: curly_braces_in_flow_control_structures
