import 'booking_clinic_option.dart';

class BookingDoctorReference {
  const BookingDoctorReference({
    required this.id,
    required this.displayName,
    required this.clinics,
  });
  final String id, displayName;
  final List<BookingClinicOption> clinics;
}
