import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../../domain/entities/booking_doctor_reference.dart';
import '../../domain/entities/booking_draft.dart';
import '../../domain/entities/booking_quote.dart';

sealed class BookingState {
  const BookingState();
}

class BookingInitial extends BookingState {
  const BookingInitial(this.doctor);
  final BookingDoctorReference doctor;
}

class BookingLoading extends BookingState {
  const BookingLoading();
}

class BookingSelectingClinic extends BookingState {
  const BookingSelectingClinic(this.doctor, this.clinics);
  final BookingDoctorReference doctor;
  final List<BookingClinicOption> clinics;
}

class BookingSelectingDate extends BookingState {
  const BookingSelectingDate(this.draft, this.availability);
  final BookingDraft draft;
  final BookingAvailability availability;
}

class BookingSelectingSlot extends BookingState {
  const BookingSelectingSlot(this.draft, this.day);
  final BookingDraft draft;
  final BookingDay day;
}

class BookingReviewing extends BookingState {
  const BookingReviewing(this.quote);
  final BookingQuote quote;
}

class BookingConfirming extends BookingState {
  const BookingConfirming(this.quote);
  final BookingQuote quote;
}

class BookingSuccess extends BookingState {
  const BookingSuccess(this.confirmation);
  final BookingConfirmation confirmation;
}

class BookingFailure extends BookingState {
  const BookingFailure(this.message);
  final String message;
}

class BookingSlotUnavailable extends BookingState {
  const BookingSlotUnavailable(this.message);
  final String message;
}
