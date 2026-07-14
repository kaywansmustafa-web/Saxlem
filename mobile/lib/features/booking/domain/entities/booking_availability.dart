import 'appointment_slot.dart';
import 'booking_types.dart';

class BookingDay {
  const BookingDay({
    required this.date,
    required this.status,
    required this.slots,
  });
  final DateTime date;
  final BookingDayStatus status;
  final List<AppointmentSlot> slots;
}

class BookingAvailability {
  const BookingAvailability({
    required this.clinicId,
    required this.version,
    required this.days,
  });
  final String clinicId;
  final int version;
  final List<BookingDay> days;
}
