import '../entities/booking_availability.dart';
import '../entities/booking_clinic_option.dart';
import '../entities/booking_confirmation.dart';
import '../entities/booking_doctor_reference.dart';
import '../entities/booking_draft.dart';
import '../entities/booking_quote.dart';

abstract interface class BookingRepository {
  Future<List<BookingClinicOption>> getClinics(BookingDoctorReference doctor);
  Future<BookingAvailability> getAvailability(
    BookingDoctorReference doctor,
    BookingClinicOption clinic,
  );
  Future<BookingQuote> createQuote(BookingDraft draft);
  Future<BookingConfirmation> confirm(
    BookingQuote quote,
    String idempotencyKey,
  );
}

class SlotUnavailableException implements Exception {}
