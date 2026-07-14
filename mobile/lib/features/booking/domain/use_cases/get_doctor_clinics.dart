import '../entities/booking_clinic_option.dart';
import '../entities/booking_doctor_reference.dart';
import '../repositories/booking_repository.dart';

class GetDoctorClinics {
  const GetDoctorClinics(this.repository);
  final BookingRepository repository;
  Future<List<BookingClinicOption>> call(BookingDoctorReference doctor) =>
      repository.getClinics(doctor);
}
