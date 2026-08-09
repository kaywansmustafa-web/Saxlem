import 'appointment_slot.dart';
import 'booking_types.dart';

class BookingDay {
  const BookingDay({required this.date, required this.slots});
  final DateTime date;
  final List<AppointmentSlot> slots;
}

class BookingAvailability {
  const BookingAvailability({
    required this.doctorId,
    required this.doctorName,
    required this.organizationId,
    required this.clinicId,
    required this.clinicName,
    required this.clinicTimezone,
    required this.appointmentType,
    required this.durationMinutes,
    required this.feeIqd,
    required this.currency,
    required this.dateFrom,
    required this.dateTo,
    required this.days,
    required this.generatedAt,
  });
  final String doctorId, doctorName, organizationId;
  final String clinicId, clinicName, clinicTimezone, currency;
  final BookingAppointmentType appointmentType;
  final int durationMinutes, feeIqd;
  final DateTime dateFrom, dateTo, generatedAt;
  final List<BookingDay> days;
}
