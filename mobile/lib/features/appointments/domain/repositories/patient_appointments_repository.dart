import '../entities/appointments_snapshot.dart';
import '../entities/patient_appointment.dart';
import '../../../../core/models/patient_profile.dart';

abstract interface class PatientAppointmentsRepository {
  Future<AppointmentPage> list(AppointmentListRequest request);
  Future<PatientAppointment> detail(
    String appointmentId,
    PatientProfileId profileId,
  );
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String operationId,
  );
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String operationId,
  );
}

class AppointmentListRequest {
  const AppointmentListRequest({
    required this.profileId,
    required this.from,
    required this.to,
    required this.status,
    this.cursor,
    this.pageSize = 25,
  });
  final PatientProfileId profileId;
  final DateTime from, to;
  final PatientAppointmentStatus status;
  final String? cursor;
  final int pageSize;
}

class AppointmentCancellation {
  const AppointmentCancellation({
    required this.appointmentId,
    required this.profileId,
    required this.reason,
    required this.version,
  });
  final String appointmentId, reason;
  final PatientProfileId profileId;
  final int version;
}

class AppointmentReschedule {
  const AppointmentReschedule({
    required this.appointmentId,
    required this.profileId,
    required this.startsAt,
    required this.durationMinutes,
    required this.version,
  });
  final String appointmentId;
  final PatientProfileId profileId;
  final DateTime startsAt;
  final int durationMinutes, version;
}

enum AppointmentProblem {
  offline,
  timeout,
  forbidden,
  sessionExpired,
  notFound,
  conflict,
  validation,
  malformed,
  unavailable,
  unknownOutcome,
  unknown,
}

class AppointmentFailure implements Exception {
  const AppointmentFailure(this.problem);
  final AppointmentProblem problem;
}
