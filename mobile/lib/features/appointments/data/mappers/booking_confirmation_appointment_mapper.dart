import '../../../../core/models/doctor_reference.dart';
import '../../../booking/domain/entities/booking_confirmation.dart';
import '../../domain/entities/patient_appointment.dart';

class BookingConfirmationAppointmentMapper {
  const BookingConfirmationAppointmentMapper();

  PatientAppointment call(BookingConfirmation confirmation) {
    final draft = confirmation.quote.draft;
    return PatientAppointment(
      id: confirmation.mockAppointmentId,
      doctor: DoctorReference(
        id: draft.doctor.id,
        displayName: draft.doctor.displayName,
        specialtyDisplayName: draft.doctor.specialtyDisplayName,
        photoUrl: draft.doctor.photoUrl,
      ),
      clinicId: draft.clinic.id,
      clinicName: draft.clinic.displayName,
      scheduledAt: draft.slot!.start,
      status: PatientAppointmentStatus.upcoming,
      feeIqd: draft.clinic.consultationFeeIqd,
      durationMinutes: draft.clinic.durationMinutes,
      profileId: draft.profileId,
    );
  }
}
