import 'appointment_slot.dart';
import 'booking_clinic_option.dart';
import 'booking_doctor_reference.dart';

class BookingDraft {
  const BookingDraft({
    required this.doctor,
    required this.clinic,
    this.date,
    this.slot,
    this.availabilityVersion,
  });
  final BookingDoctorReference doctor;
  final BookingClinicOption clinic;
  final DateTime? date;
  final AppointmentSlot? slot;
  final int? availabilityVersion;
  BookingDraft copyWith({
    DateTime? date,
    AppointmentSlot? slot,
    int? availabilityVersion,
  }) => BookingDraft(
    doctor: doctor,
    clinic: clinic,
    date: date ?? this.date,
    slot: slot ?? this.slot,
    availabilityVersion: availabilityVersion ?? this.availabilityVersion,
  );
}
