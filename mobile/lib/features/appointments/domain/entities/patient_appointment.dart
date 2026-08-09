import '../../../../core/models/doctor_reference.dart';
import '../../../../core/models/patient_profile.dart';

enum PatientAppointmentStatus {
  scheduled,
  confirmed,
  cancelled,
  completed,
  noShow,
}

enum PatientAppointmentType { initial, followUp }

class PatientAppointment {
  const PatientAppointment({
    required this.id,
    required this.doctor,
    required this.clinicId,
    required this.clinicName,
    required this.reference,
    required this.profileId,
    required this.patientName,
    required this.type,
    required this.reason,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.feeIqd,
    required this.durationMinutes,
    required this.version,
    this.cancellationReason,
  });

  final String id, reference, patientName, reason;
  final DoctorReference doctor;
  final String clinicId;
  final String clinicName;
  final PatientProfileId profileId;
  final PatientAppointmentType type;
  final DateTime startsAt, endsAt;
  final PatientAppointmentStatus status;
  final int feeIqd;
  final int durationMinutes;
  final String? cancellationReason;
  final int version;

  bool get canMutate =>
      status == PatientAppointmentStatus.scheduled ||
      status == PatientAppointmentStatus.confirmed;
}
