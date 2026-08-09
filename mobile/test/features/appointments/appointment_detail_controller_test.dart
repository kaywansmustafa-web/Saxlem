import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/appointments/domain/entities/appointments_snapshot.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/presentation/controllers/appointment_detail_controller.dart';
import 'package:saxlem_app/features/appointments/presentation/state/appointment_detail_state.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_availability.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_confirmation.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_draft.dart';
import 'package:saxlem_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:saxlem_app/features/booking/domain/services/booking_operation_id.dart';

void main() {
  test('unchanged cancellation retry reuses operation identity', () async {
    final repository = _Repository()
      ..cancelFailure = const AppointmentFailure(
        AppointmentProblem.unknownOutcome,
      );
    final controller = _controller(repository)..load();
    await Future<void>.delayed(Duration.zero);
    await controller.cancel('Travel');
    await controller.cancel('Travel');
    expect(repository.keys, ['operation-1', 'operation-1']);
    controller.dispose();
  });

  test('changed cancellation and reschedule use distinct identities', () async {
    final repository = _Repository()
      ..cancelFailure = const AppointmentFailure(
        AppointmentProblem.unknownOutcome,
      );
    final controller = _controller(repository)..load();
    await Future<void>.delayed(Duration.zero);
    await controller.cancel('Travel');
    await controller.cancel('Changed reason');
    expect(repository.keys, ['operation-1', 'operation-2']);
    controller.dispose();
  });

  test('terminal appointment exposes no mutation state', () async {
    final repository = _Repository(
      item: appointment(PatientAppointmentStatus.completed),
    );
    final controller = _controller(repository)..load();
    await Future<void>.delayed(Duration.zero);
    await controller.cancel('Travel');
    expect(repository.keys, isEmpty);
    expect(
      (controller.state as AppointmentDetailReady).appointment.canMutate,
      false,
    );
    controller.dispose();
  });
}

AppointmentDetailController _controller(_Repository repository) =>
    AppointmentDetailController(
      appointmentId: appointmentId,
      profileId: const PatientProfileId(profileId),
      repository: repository,
      bookingRepository: _BookingRepository(),
      operationIds: _Ids(),
      onChanged: () async {},
    );

class _Ids implements BookingOperationIdGenerator {
  int value = 0;
  @override
  String generate() => 'operation-${++value}';
}

class _Repository implements PatientAppointmentsRepository {
  _Repository({PatientAppointment? item}) : item = item ?? appointment();
  PatientAppointment item;
  AppointmentFailure? cancelFailure;
  final keys = <String>[];
  @override
  Future<PatientAppointment> detail(
    String id,
    PatientProfileId profileId,
  ) async => item;
  @override
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String operationId,
  ) async {
    keys.add(operationId);
    if (cancelFailure case final failure?) throw failure;
    return item;
  }

  @override
  Future<AppointmentPage> list(AppointmentListRequest request) =>
      throw UnimplementedError();
  @override
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String operationId,
  ) => throw UnimplementedError();
}

class _BookingRepository implements BookingRepository {
  @override
  Future<BookingAvailability> loadOptions(BookingOptionsRequest request) =>
      throw UnimplementedError();
  @override
  Future<BookingConfirmation> create(BookingDraft draft, String operationId) =>
      throw UnimplementedError();
}

PatientAppointment appointment([
  PatientAppointmentStatus status = PatientAppointmentStatus.scheduled,
]) {
  final start = DateTime.utc(2030, 8, 10, 6);
  return PatientAppointment(
    id: appointmentId,
    reference: 'SX-2030-000001',
    doctor: const DoctorReference(
      id: '00000000-0000-4000-8000-000000000003',
      displayName: 'Doctor',
      specialtyDisplayName: '',
    ),
    clinicId: '00000000-0000-4000-8000-000000000002',
    clinicName: 'Clinic',
    profileId: const PatientProfileId(profileId),
    patientName: 'Patient',
    type: PatientAppointmentType.initial,
    reason: 'Reason',
    startsAt: start,
    endsAt: start.add(const Duration(minutes: 30)),
    status: status,
    feeIqd: 35000,
    durationMinutes: 30,
    version: 2,
  );
}

const appointmentId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000004';
