import 'booking_types.dart';

class AppointmentSlot {
  const AppointmentSlot({
    required this.id,
    required this.clinicId,
    required this.start,
    required this.end,
    required this.status,
    required this.availabilityVersion,
  });
  final String id, clinicId;
  final DateTime start, end;
  final BookingSlotStatus status;
  final int availabilityVersion;
}
