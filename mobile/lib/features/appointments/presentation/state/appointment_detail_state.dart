import '../../../booking/domain/entities/booking_availability.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';

sealed class AppointmentDetailState {
  const AppointmentDetailState();
}

class AppointmentDetailLoading extends AppointmentDetailState {
  const AppointmentDetailLoading();
}

class AppointmentDetailReady extends AppointmentDetailState {
  const AppointmentDetailReady(
    this.appointment, {
    this.submitting = false,
    this.problem,
    this.availability,
    this.loadingAvailability = false,
  });
  final PatientAppointment appointment;
  final bool submitting, loadingAvailability;
  final AppointmentProblem? problem;
  final BookingAvailability? availability;
}

class AppointmentDetailFailure extends AppointmentDetailState {
  const AppointmentDetailFailure(this.problem);
  final AppointmentProblem problem;
}
