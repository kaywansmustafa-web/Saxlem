import 'booking_clinic_option.dart';

class BookingDoctorReference {
  const BookingDoctorReference({
    required this.id,
    required this.displayName,
    required this.clinics,
    this.followUpOnly = false,
  });
  final String id, displayName;
  final List<BookingClinicOption> clinics;

  /// The doctor isn't taking new patients in the app (Owner Portal): only
  /// follow-up visits can be booked.
  final bool followUpOnly;
}
