import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/live_queue/data/dto/patient_queue_snapshot_dto.dart';
import 'package:saxlem_app/features/live_queue/data/mappers/patient_queue_snapshot_mapper.dart';
import 'package:saxlem_app/features/live_queue/domain/services/queue_guidance_service.dart';

void main() {
  test('maps a transport DTO and generates calm guidance', () {
    final dto = PatientQueueSnapshotDto(
      sessionId: 's',
      queueEntryId: 'e',
      queueVersion: 1,
      careProviderDisplayName: 'Dr. Test',
      serviceDisplayName: 'Eye',
      anonymousCurrentToken: '2',
      patientNumber: '5',
      patientsAhead: 3,
      estimatedWaitLowerMinutes: 20,
      estimatedWaitUpperMinutes: 28,
      estimateConfidence: 'medium',
      doctorTimingMinutes: 0,
      patientStatus: 'expected',
      sessionStatus: 'open',
      lastUpdatedAt: DateTime.now().toIso8601String(),
      remoteWaitingAllowed: true,
      allowedActions: const ['onMyWay'],
    );

    final snapshot = const PatientQueueSnapshotMapper(
      RuleBasedQueueGuidanceService(
        doctorDelayed: "Doctor is delayed. We'll keep you updated.",
        headToReception: 'Please head to reception.',
        leaveSoon: 'Leave in about 10 minutes.',
        relax: 'Relax, no need to leave yet.',
      ),
    ).toDomain(dto);

    expect(snapshot.guidanceMessage, 'Relax, no need to leave yet.');
    expect(snapshot.allowedActions.single.name, 'onMyWay');
  });
}
