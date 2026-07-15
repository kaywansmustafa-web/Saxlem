import '../../../../core/models/doctor_reference.dart';
import '../../../../core/models/patient_profile.dart';

enum PatientAppointmentStatus { upcoming, completed, cancelled }

class PatientAppointment {
  const PatientAppointment({
    required this.id,
    required this.doctor,
    required this.clinicId,
    required this.clinicName,
    required this.scheduledAt,
    required this.status,
    required this.feeIqd,
    required this.durationMinutes,
    this.estimatedWaitMinutes,
    this.queueEntryId,
    this.profileId = PatientProfileId.me,
  });

  final String id;
  final DoctorReference doctor;
  final String clinicId;
  final String clinicName;
  final DateTime scheduledAt;
  final PatientAppointmentStatus status;
  final int feeIqd;
  final int durationMinutes;
  final int? estimatedWaitMinutes;
  final String? queueEntryId;
  final PatientProfileId profileId;
}
