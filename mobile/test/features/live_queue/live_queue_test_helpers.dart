import 'package:saxlem_app/features/live_queue/domain/entities/patient_queue_status.dart';
import 'package:saxlem_app/features/live_queue/domain/repositories/live_queue_repository.dart';

class FakeQueueRepository implements LiveQueueRepository {
  FakeQueueRepository(this.result);
  final PatientQueueStatus result;
  int calls = 0;
  @override
  Future<PatientQueueStatus> getQueueStatus(String appointmentId) async {
    calls++;
    return result;
  }
}

PatientQueueStatus queueStatus({
  PatientEntryStatus entry = PatientEntryStatus.waiting,
  QueueState state = QueueState.open,
}) => PatientQueueStatus(
  appointmentId: '11111111-1111-4111-8111-111111111111',
  queueState: state,
  ticketNumber: entry == PatientEntryStatus.notEnqueued ? null : 4,
  currentTicketNumber: entry == PatientEntryStatus.notEnqueued ? null : 2,
  patientsAhead: entry == PatientEntryStatus.notEnqueued ? 0 : 2,
  instruction: 'Please wait for your turn.',
  estimateSuspended: false,
  doctor: const QueueReference(
    '22222222-2222-4222-8222-222222222222',
    'Doctor',
  ),
  clinic: const QueueReference(
    '33333333-3333-4333-8333-333333333333',
    'Clinic',
  ),
  appointmentReference: 'SX-2026-000001',
  patientEntryStatus: entry,
  updatedAt: DateTime.parse('2026-08-10T09:00:00+03:00'),
  estimatedWait: entry == PatientEntryStatus.notEnqueued
      ? null
      : const EstimatedWait(10, 15),
);
