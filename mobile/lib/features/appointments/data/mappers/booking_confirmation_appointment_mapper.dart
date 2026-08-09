import '../../../booking/domain/entities/booking_confirmation.dart';
import '../../domain/entities/patient_appointment.dart';

class BookingConfirmationAppointmentMapper {
  const BookingConfirmationAppointmentMapper();

  PatientAppointment call(BookingConfirmation confirmation) {
    throw UnsupportedError(
      'Appointment persistence and history are deferred to Sprint 13Q-C.',
    );
  }
}
