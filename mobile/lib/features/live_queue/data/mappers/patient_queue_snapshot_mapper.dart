import '../../domain/entities/patient_queue_snapshot.dart';
import '../../domain/entities/queue_types.dart';
import '../../domain/services/queue_guidance_service.dart';
import '../dto/patient_queue_snapshot_dto.dart';

class PatientQueueSnapshotMapper {
  const PatientQueueSnapshotMapper(this._guidanceService);
  final QueueGuidanceService _guidanceService;

  PatientQueueSnapshot toDomain(PatientQueueSnapshotDto dto) {
    final snapshot = PatientQueueSnapshot(
      sessionId: dto.sessionId,
      queueEntryId: dto.queueEntryId,
      queueVersion: dto.queueVersion,
      careProviderDisplayName: dto.careProviderDisplayName,
      serviceDisplayName: dto.serviceDisplayName,
      anonymousCurrentToken: dto.anonymousCurrentToken,
      patientNumber: dto.patientNumber,
      patientsAhead: dto.patientsAhead,
      estimatedWaitLowerMinutes: dto.estimatedWaitLowerMinutes,
      estimatedWaitUpperMinutes: dto.estimatedWaitUpperMinutes,
      estimateConfidence: QueueEstimateConfidence.values.byName(
        dto.estimateConfidence,
      ),
      doctorTimingMinutes: dto.doctorTimingMinutes,
      patientStatus: PatientQueueStatus.values.byName(dto.patientStatus),
      sessionStatus: QueueSessionStatus.values.byName(dto.sessionStatus),
      lastUpdatedAt: DateTime.parse(dto.lastUpdatedAt),
      remoteWaitingAllowed: dto.remoteWaitingAllowed,
      allowedActions: dto.allowedActions
          .map(PatientQueueAction.values.byName)
          .toSet(),
      guidanceMessage: '',
    );
    return snapshot.copyWith(
      guidanceMessage: _guidanceService.guidanceFor(snapshot),
    );
  }
}
