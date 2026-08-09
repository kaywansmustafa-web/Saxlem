class BookingConfirmation {
  const BookingConfirmation({
    required this.appointmentId,
    required this.reference,
    required this.clinicId,
    required this.clinicName,
    required this.clinicTimezone,
    required this.doctorId,
    required this.doctorName,
    required this.patientProfileId,
    required this.patientName,
    required this.startsAt,
    required this.endsAt,
    required this.durationMinutes,
    required this.feeIqd,
    required this.version,
  });
  final String appointmentId, reference, clinicId, clinicName, clinicTimezone;
  final String doctorId, doctorName, patientProfileId, patientName;
  final DateTime startsAt, endsAt;
  final int durationMinutes, feeIqd, version;
}
