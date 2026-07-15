import 'package:flutter/foundation.dart';
import '../../domain/entities/appointment_slot.dart';
import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../domain/entities/booking_doctor_reference.dart';
import '../../domain/entities/booking_draft.dart';
import '../../domain/entities/booking_types.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../domain/use_cases/confirm_booking.dart';
import '../../domain/use_cases/create_booking_quote.dart';
import '../../domain/use_cases/get_booking_availability.dart';
import '../../domain/use_cases/get_doctor_clinics.dart';
import '../state/booking_state.dart';
import '../../../../core/models/patient_profile.dart';

class BookingController extends ChangeNotifier {
  BookingController({
    required this.doctor,
    required this.getClinics,
    required this.getAvailability,
    required this.createQuote,
    required this.confirmBooking,
    this.onConfirmed,
    this.profileId = PatientProfileId.me,
  });
  final BookingDoctorReference doctor;
  final GetDoctorClinics getClinics;
  final GetBookingAvailability getAvailability;
  final CreateBookingQuote createQuote;
  final ConfirmBooking confirmBooking;
  final Future<void> Function(BookingConfirmation confirmation)? onConfirmed;
  PatientProfileId profileId;
  void selectProfile(PatientProfileId value) {
    profileId = value;
    load();
  }

  BookingState state = const BookingLoading();
  bool confirming = false;
  BookingClinicOption? clinic;
  BookingAvailability? availability;
  Future<void> load() async {
    state = const BookingLoading();
    notifyListeners();
    try {
      state = BookingSelectingClinic(doctor, await getClinics(doctor));
    } catch (_) {
      state = const BookingFailure('We could not load booking options.');
    }
    notifyListeners();
  }

  Future<void> selectClinic(BookingClinicOption value) async {
    clinic = value;
    state = const BookingLoading();
    notifyListeners();
    try {
      availability = await getAvailability(doctor, value);
      state = BookingSelectingDate(
        BookingDraft(doctor: doctor, clinic: value, profileId: profileId),
        availability!,
      );
    } catch (_) {
      state = const BookingFailure('We could not load available dates.');
    }
    notifyListeners();
  }

  void selectDate(BookingDay day) {
    if (day.status != BookingDayStatus.available) return;
    state = BookingSelectingSlot(
      BookingDraft(
        doctor: doctor,
        clinic: clinic!,
        date: day.date,
        availabilityVersion: availability!.version,
        profileId: profileId,
      ),
      day,
    );
    notifyListeners();
  }

  Future<void> selectSlot(AppointmentSlot slot) async {
    if (slot.status != BookingSlotStatus.available) return;
    final draft = BookingDraft(
      doctor: doctor,
      clinic: clinic!,
      date: slot.start,
      slot: slot,
      availabilityVersion: availability!.version,
      profileId: profileId,
    );
    state = const BookingLoading();
    notifyListeners();
    try {
      state = BookingReviewing(await createQuote(draft));
    } on SlotUnavailableException {
      state = const BookingSlotUnavailable(
        'That time was just booked. Please choose another time.',
      );
    } catch (_) {
      state = const BookingFailure('We could not prepare your booking.');
    }
    notifyListeners();
  }

  Future<void> confirm() async {
    final current = state;
    if (current is! BookingReviewing || confirming) return;
    confirming = true;
    state = BookingConfirming(current.quote);
    notifyListeners();
    try {
      final confirmation = await confirmBooking(
        current.quote,
        'confirm-${current.quote.id}',
      );
      await onConfirmed?.call(confirmation);
      state = BookingSuccess(confirmation);
    } on SlotUnavailableException {
      state = const BookingSlotUnavailable('That time is no longer available.');
    } catch (_) {
      state = const BookingFailure('We could not confirm your booking.');
    }
    confirming = false;
    notifyListeners();
  }

  void restart() => load();
}
