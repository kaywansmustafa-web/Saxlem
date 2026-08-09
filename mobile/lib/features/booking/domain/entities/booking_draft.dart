import 'appointment_slot.dart';
import 'booking_availability.dart';
import '../../../../core/models/patient_profile.dart';

class BookingDraft {
  const BookingDraft({
    required this.options,
    required this.profileId,
    required this.reason,
    required this.slot,
  });
  final BookingAvailability options;
  final PatientProfileId profileId;
  final String reason;
  final AppointmentSlot slot;
}
