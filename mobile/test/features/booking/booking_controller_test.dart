import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/booking/domain/entities/appointment_slot.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_availability.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_clinic_option.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_confirmation.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_doctor_reference.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_draft.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_types.dart';
import 'package:saxlem_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:saxlem_app/features/booking/domain/services/booking_operation_id.dart';
import 'package:saxlem_app/features/booking/presentation/controllers/booking_controller.dart';
import 'package:saxlem_app/features/booking/presentation/state/booking_state.dart';

void main() {
  test('stale options cannot overwrite changed profile criteria', () async {
    final repository = _FakeRepository()..deferred = Completer();
    final controller = _controller(repository)..load();
    controller.selectClinic(clinic);
    controller.setReason('Reason');
    final pending = controller.loadOptions();
    controller.selectProfile(const PatientProfileId(otherProfileId));
    repository.deferred!.complete(options);
    await pending;
    expect(controller.state, isA<BookingSetup>());
    controller.dispose();
  });

  test(
    'same failed attempt reuses key and duplicate submit is blocked',
    () async {
      final repository = _FakeRepository();
      final ids = _Ids();
      final controller = _controller(repository, ids: ids)..load();
      controller.selectClinic(clinic);
      controller.setReason('Reason');
      await controller.loadOptions();
      controller.selectSlot(options.days.first.slots.single);
      repository.createError = const BookingFailure(
        BookingProblem.unknownOutcome,
      );
      await controller.confirm();
      expect(repository.keys, ['operation-1']);
      controller.restart();
      expect(controller.state, isA<BookingReviewing>());
      final first = controller.confirm();
      final duplicate = controller.confirm();
      await Future.wait([first, duplicate]);
      expect(repository.keys, ['operation-1', 'operation-1']);
      controller.dispose();
    },
  );

  test('profile change ignores a late appointment confirmation', () async {
    final repository = _FakeRepository()..createDeferred = Completer();
    final controller = _controller(repository)..load();
    controller.selectClinic(clinic);
    controller.setReason('Reason');
    await controller.loadOptions();
    controller.selectSlot(options.days.first.slots.single);
    final pending = controller.confirm();
    controller.selectProfile(const PatientProfileId(otherProfileId));
    repository.createDeferred!.complete(confirmation);
    await pending;
    expect(controller.state, isA<BookingSetup>());
    controller.dispose();
  });
}

BookingController _controller(_FakeRepository repository, {_Ids? ids}) =>
    BookingController(
      doctor: doctor,
      repository: repository,
      operationIds: ids ?? _Ids(),
      profileId: const PatientProfileId(profileId),
      now: () => DateTime.utc(2030, 8, 9),
    );

class _Ids implements BookingOperationIdGenerator {
  int count = 0;
  @override
  String generate() => 'operation-${++count}';
}

class _FakeRepository implements BookingRepository {
  Completer<BookingAvailability>? deferred;
  BookingFailure? createError;
  final keys = <String>[];
  BookingDraft? lastDraft;
  Completer<BookingConfirmation>? createDeferred;
  @override
  Future<BookingAvailability> loadOptions(BookingOptionsRequest request) =>
      deferred?.future ?? Future.value(options);
  @override
  Future<BookingConfirmation> create(
    BookingDraft draft,
    String operationId,
  ) async {
    keys.add(operationId);
    lastDraft = draft;
    if (createError case final error?) throw error;
    return createDeferred?.future ?? confirmation;
  }
}

const profileId = '00000000-0000-4000-8000-000000000004';
const otherProfileId = '00000000-0000-4000-8000-000000000006';
const clinic = BookingClinicOption(
  id: '00000000-0000-4000-8000-000000000003',
  displayName: 'Clinic',
);
const doctor = BookingDoctorReference(
  id: '00000000-0000-4000-8000-000000000001',
  displayName: 'Doctor',
  clinics: [clinic],
);
final slot = AppointmentSlot(
  startsAt: DateTime.utc(2030, 8, 10, 6),
  endsAt: DateTime.utc(2030, 8, 10, 6, 30),
  durationMinutes: 30,
);
final options = BookingAvailability(
  doctorId: doctor.id,
  doctorName: doctor.displayName,
  organizationId: '00000000-0000-4000-8000-000000000002',
  clinicId: clinic.id,
  clinicName: clinic.displayName,
  clinicTimezone: 'Asia/Baghdad',
  appointmentType: BookingAppointmentType.initial,
  durationMinutes: 30,
  feeIqd: 35000,
  currency: 'IQD',
  dateFrom: DateTime.utc(2030, 8, 10),
  dateTo: DateTime.utc(2030, 8, 11),
  days: [
    BookingDay(date: DateTime.utc(2030, 8, 10), slots: [slot]),
  ],
  generatedAt: DateTime.utc(2030, 8, 9),
);
final confirmation = BookingConfirmation(
  appointmentId: '00000000-0000-4000-8000-000000000005',
  reference: 'SX-1',
  clinicId: clinic.id,
  clinicName: clinic.displayName,
  clinicTimezone: 'Asia/Baghdad',
  doctorId: doctor.id,
  doctorName: doctor.displayName,
  patientProfileId: profileId,
  patientName: 'Patient',
  startsAt: slot.startsAt,
  endsAt: slot.endsAt,
  durationMinutes: 30,
  feeIqd: 35000,
  version: 1,
);
