import 'dart:async';

import '../../../../core/models/doctor_reference.dart';
import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';

class InMemoryPatientAppointmentsRepository
    implements PatientAppointmentsRepository {
  InMemoryPatientAppointmentsRepository({
    List<PatientAppointment> initialAppointments = const [],
    bool hasAppointmentHistory = false,
  }) : _appointments = List.of(initialAppointments),
       _hasAppointmentHistory =
           hasAppointmentHistory || initialAppointments.isNotEmpty;

  static final shared = InMemoryPatientAppointmentsRepository(
    initialAppointments: _fixtures(),
  );

  final List<PatientAppointment> _appointments;
  bool _hasAppointmentHistory;
  final _changes = StreamController<AppointmentsSnapshot>.broadcast();

  AppointmentsSnapshot get _snapshot => AppointmentsSnapshot(
    appointments: List.unmodifiable(_appointments),
    hasAppointmentHistory: _hasAppointmentHistory,
  );

  @override
  Future<AppointmentsSnapshot> load() async => _snapshot;

  @override
  Stream<AppointmentsSnapshot> watch() => _changes.stream;

  @override
  Future<void> add(PatientAppointment appointment) async {
    _appointments.removeWhere((item) => item.id == appointment.id);
    _appointments.insert(0, appointment);
    _hasAppointmentHistory = true;
    _changes.add(_snapshot);
  }

  static List<PatientAppointment> _fixtures() {
    final now = DateTime.now();
    const doctor = DoctorReference(
      id: 'doctor-1',
      displayName: 'Dr. Shivan Ahmed',
      specialtyDisplayName: 'Cardiology',
    );
    return [
      PatientAppointment(
        id: 'SAX-20481',
        doctor: doctor,
        clinicId: 'clinic-1',
        clinicName: 'Saxlem Medical Center',
        scheduledAt: DateTime(now.year, now.month, now.day + 2, 10, 30),
        status: PatientAppointmentStatus.upcoming,
        feeIqd: 35000,
        durationMinutes: 25,
      ),
      PatientAppointment(
        id: 'SAX-19342',
        doctor: doctor,
        clinicId: 'clinic-1',
        clinicName: 'Saxlem Medical Center',
        scheduledAt: now.subtract(const Duration(days: 14)),
        status: PatientAppointmentStatus.completed,
        feeIqd: 35000,
        durationMinutes: 25,
      ),
    ];
  }
}
