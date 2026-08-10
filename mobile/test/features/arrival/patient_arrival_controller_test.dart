import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/arrival/domain/entities/patient_arrival.dart';
import 'package:saxlem_app/features/arrival/domain/repositories/patient_arrival_repository.dart';
import 'package:saxlem_app/features/arrival/presentation/controllers/patient_arrival_controller.dart';
import 'package:saxlem_app/features/arrival/presentation/state/patient_arrival_state.dart';
import 'package:saxlem_app/features/booking/domain/services/booking_operation_id.dart';

void main() {
  test(
    'loads, submits once, and keeps operation identity for explicit retry',
    () async {
      final repository = _Repository()
        ..recordFailure = const ArrivalFailure(ArrivalProblem.unknownOutcome);
      final controller = PatientArrivalController(
        appointmentId: _appointment,
        expectedProfileId: _profile,
        repository: repository,
        operationIds: _Ids(),
      );
      await controller.load();
      await controller.recordArrival();
      await controller.recordArrival();
      expect(repository.operationIds, [
        'arrival-operation-0001',
        'arrival-operation-0001',
      ]);
      controller.dispose();
    },
  );
  test('profile mismatch fails closed', () async {
    final repository = _Repository()
      ..profileId = '66666666-6666-4666-8666-666666666666';
    final controller = PatientArrivalController(
      appointmentId: _appointment,
      expectedProfileId: _profile,
      repository: repository,
      operationIds: _Ids(),
    );
    await controller.load();
    expect(controller.state, isA<PatientArrivalFailed>());
    controller.dispose();
  });
}

const _appointment = '22222222-2222-4222-8222-222222222222',
    _profile = '55555555-5555-4555-8555-555555555555';

class _Ids implements BookingOperationIdGenerator {
  int value = 0;
  @override
  String generate() =>
      'arrival-operation-${(++value).toString().padLeft(4, '0')}';
}

class _Repository implements PatientArrivalRepository {
  String profileId = _profile;
  ArrivalFailure? recordFailure;
  final operationIds = <String>[];
  PatientArrival get value => PatientArrival(
    id: '11111111-1111-4111-8111-111111111111',
    appointmentId: _appointment,
    appointmentReference: 'SX-2026-000001',
    clinicId: '33333333-3333-4333-8333-333333333333',
    clinicName: 'Clinic',
    doctorId: '44444444-4444-4444-8444-444444444444',
    doctorName: 'Doctor',
    patientProfileId: profileId,
    patientName: 'Patient',
    appointmentStartsAt: DateTime.parse('2026-08-10T09:00:00+03:00'),
    status: ArrivalStatus.expected,
    version: 1,
    eligibility: const ArrivalEligibility(
      canArrive: true,
      reason: ArrivalEligibilityReason.eligible,
    ),
  );
  @override
  Future<PatientArrival> getArrival(String appointmentId) async => value;
  @override
  Future<PatientArrival> recordArrival(
    String appointmentId,
    int expectedVersion,
    String operationId,
  ) async {
    operationIds.add(operationId);
    if (recordFailure case final failure?) throw failure;
    return value;
  }
}
