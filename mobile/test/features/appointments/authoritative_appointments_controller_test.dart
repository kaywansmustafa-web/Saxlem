import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/appointments/domain/entities/appointments_snapshot.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/presentation/controllers/appointments_controller.dart';
import 'package:saxlem_app/features/appointments/presentation/state/appointments_state.dart';

void main() {
  test('loads and groups all five authoritative statuses', () async {
    final repository = _Repository();
    final controller = AppointmentsController(repository);
    await controller.load(const PatientProfileId(profileId));
    final ready = controller.state as AppointmentsReady;
    expect(
      ready.snapshot.appointments.map((item) => item.status).toSet(),
      PatientAppointmentStatus.values.toSet(),
    );
    expect(ready.count(AppointmentsTab.upcoming), 2);
    expect(ready.count(AppointmentsTab.completed), 2);
    expect(ready.count(AppointmentsTab.cancelled), 1);
    controller.dispose();
  });

  test('load-more failure retains existing appointments', () async {
    final repository = _Repository(withCursor: true);
    final controller = AppointmentsController(repository);
    await controller.load(const PatientProfileId(profileId));
    repository.failPages = true;
    await controller.loadMore();
    final ready = controller.state as AppointmentsReady;
    expect(ready.snapshot.appointments, isNotEmpty);
    expect(ready.loadMoreProblem, AppointmentProblem.offline);
    controller.dispose();
  });

  test('profile change discards an older late load', () async {
    final repository = _Repository()..deferred = Completer();
    final controller = AppointmentsController(repository);
    final old = controller.load(const PatientProfileId(profileId));
    final newer = controller.load(const PatientProfileId(otherProfileId));
    repository.deferred!.complete(
      const AppointmentPage(items: [], nextCursor: null),
    );
    await Future.wait([old, newer]);
    expect(repository.requests.last.profileId.value, otherProfileId);
    controller.dispose();
  });
}

class _Repository implements PatientAppointmentsRepository {
  _Repository({this.withCursor = false});
  final bool withCursor;
  bool failPages = false;
  Completer<AppointmentPage>? deferred;
  final requests = <AppointmentListRequest>[];
  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async {
    requests.add(request);
    if (failPages && request.cursor != null) {
      throw const AppointmentFailure(AppointmentProblem.offline);
    }
    if (deferred != null) return deferred!.future;
    return AppointmentPage(
      items: [_appointment(request.status, request.profileId)],
      nextCursor:
          withCursor &&
              (request.status == PatientAppointmentStatus.scheduled ||
                  request.status == PatientAppointmentStatus.confirmed)
          ? 'cursor-${request.status.name}'
          : null,
    );
  }

  @override
  Future<PatientAppointment> detail(String id, PatientProfileId profileId) =>
      throw UnimplementedError();
  @override
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String key,
  ) => throw UnimplementedError();
  @override
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String key,
  ) => throw UnimplementedError();
}

PatientAppointment _appointment(
  PatientAppointmentStatus status,
  PatientProfileId profile,
) {
  final start =
      status == PatientAppointmentStatus.scheduled ||
          status == PatientAppointmentStatus.confirmed
      ? DateTime.now().toUtc().add(const Duration(days: 2))
      : DateTime.now().toUtc().subtract(const Duration(days: 2));
  final index = PatientAppointmentStatus.values.indexOf(status) + 1;
  return PatientAppointment(
    id: '00000000-0000-4000-8000-${index.toString().padLeft(12, '0')}',
    reference: 'SX-2030-${index.toString().padLeft(6, '0')}',
    doctor: const DoctorReference(
      id: '00000000-0000-4000-8000-000000000010',
      displayName: 'Doctor',
      specialtyDisplayName: '',
    ),
    clinicId: '00000000-0000-4000-8000-000000000011',
    clinicName: 'Clinic',
    profileId: profile,
    patientName: 'Patient',
    type: PatientAppointmentType.initial,
    reason: 'Reason',
    startsAt: start,
    endsAt: start.add(const Duration(minutes: 30)),
    status: status,
    feeIqd: 35000,
    durationMinutes: 30,
    version: 1,
  );
}

const profileId = '00000000-0000-4000-8000-000000000004';
const otherProfileId = '00000000-0000-4000-8000-000000000005';
