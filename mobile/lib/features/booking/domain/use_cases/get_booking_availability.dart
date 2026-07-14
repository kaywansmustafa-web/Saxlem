import '../entities/booking_availability.dart';
import '../entities/booking_clinic_option.dart';
import '../entities/booking_doctor_reference.dart';
import '../repositories/booking_repository.dart';

class GetBookingAvailability {
  const GetBookingAvailability(this.repository);
  final BookingRepository repository;
  Future<BookingAvailability> call(
    BookingDoctorReference doctor,
    BookingClinicOption clinic,
  ) => repository.getAvailability(doctor, clinic);
}
