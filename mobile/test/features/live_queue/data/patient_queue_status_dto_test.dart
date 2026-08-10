import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/live_queue/data/dto/patient_queue_status_dto.dart';
import 'package:saxlem_app/features/live_queue/domain/entities/patient_queue_status.dart';

void main() {
  Map<String, dynamic> value() => {
    'queueState': 'open',
    'ticketNumber': 4,
    'currentTicketNumber': 2,
    'patientsAhead': 2,
    'queueHealth': 'healthy',
    'instruction': 'Please wait.',
    'estimatedWait': {'minimumMinutes': 10, 'maximumMinutes': 15},
    'estimateSuspended': false,
    'doctor': {'id': '22222222-2222-4222-8222-222222222222', 'name': 'Doctor'},
    'clinic': {'id': '33333333-3333-4333-8333-333333333333', 'name': 'Clinic'},
    'appointmentReference': 'SX-2026-000001',
    'patientEntryStatus': 'waiting',
    'updatedAt': '2026-08-10T09:00:00+03:00',
  };
  test('strictly parses waiting snapshot', () {
    expect(
      PatientQueueStatusDto.parse(
        '11111111-1111-4111-8111-111111111111',
        value(),
      ).patientEntryStatus,
      PatientEntryStatus.waiting,
    );
  });
  test('accepts not enrolled as normal status', () {
    final json = value()
      ..addAll({
        'ticketNumber': null,
        'patientsAhead': 0,
        'estimatedWait': null,
        'patientEntryStatus': 'notEnqueued',
      });
    expect(
      PatientQueueStatusDto.parse(
        '11111111-1111-4111-8111-111111111111',
        json,
      ).ticketNumber,
      isNull,
    );
  });
  test('rejects fabricated fields', () {
    final json = value();
    json['remoteWaitingAllowed'] = true;
    expect(
      () => PatientQueueStatusDto.parse(
        '11111111-1111-4111-8111-111111111111',
        json,
      ),
      throwsFormatException,
    );
  });
  test('accepts every authoritative queue and entry state', () {
    for (final queueState in const ['notStarted', 'open', 'paused', 'closed']) {
      for (final entry in const [
        'waiting',
        'called',
        'noResponse',
        'inConsultation',
        'completed',
        'removed',
      ]) {
        final json = value()
          ..['queueState'] = queueState
          ..['patientEntryStatus'] = entry;
        expect(
          PatientQueueStatusDto.parse(
            '11111111-1111-4111-8111-111111111111',
            json,
          ).appointmentId,
          isNotEmpty,
        );
      }
    }
  });
}
