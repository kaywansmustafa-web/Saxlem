import 'appointment_slot.dart';
import 'booking_clinic_option.dart';
import 'booking_doctor_reference.dart';
import '../../../../core/models/patient_profile.dart';

class BookingDraft {
  const BookingDraft({
    required this.doctor,
    required this.clinic,
    this.date,
    this.slot,
    this.availabilityVersion,
    this.profileId = PatientProfileId.me,
  });
  final BookingDoctorReference doctor;
  final BookingClinicOption clinic;
  final DateTime? date;
  final AppointmentSlot? slot;
  final int? availabilityVersion;
  final PatientProfileId profileId;
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
    profileId: profileId,
  );
}
