import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../../domain/entities/booking_doctor_reference.dart';
import '../../domain/entities/booking_draft.dart';
import '../../domain/entities/booking_quote.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../domain/services/arrival_recommendation_service.dart';
import '../data_sources/mock_booking_data_source.dart';
import '../mappers/booking_mapper.dart';

class BookingRepositoryImpl implements BookingRepository {
  BookingRepositoryImpl(this.source, this.mapper, this.arrival);
  final MockBookingDataSource source;
  final BookingMapper mapper;
  final ArrivalRecommendationService arrival;
  final Map<String, BookingConfirmation> confirmations = {};
  @override
  Future<List<BookingClinicOption>> getClinics(
    BookingDoctorReference doctor,
  ) async => (await source.clinics()).map(mapper.clinic).toList();
  @override
  Future<BookingAvailability> getAvailability(
    BookingDoctorReference doctor,
    BookingClinicOption clinic,
  ) async => mapper.availability(await source.availability(clinic.id));
  @override
  Future<BookingQuote> createQuote(BookingDraft draft) async {
    if (draft.slot == null || !source.isAvailable(draft.slot!.id)) {
      throw SlotUnavailableException();
    }
    return BookingQuote(
      id: 'quote-${DateTime.now().microsecondsSinceEpoch}',
      draft: draft,
      arrivalRecommendation: arrival.forDuration(draft.clinic.durationMinutes),
      expiresAt: DateTime.now().add(const Duration(minutes: 5)),
    );
  }

  @override
  Future<BookingConfirmation> confirm(BookingQuote quote, String key) async {
    if (confirmations.containsKey(key)) return confirmations[key]!;
    await Future<void>.delayed(const Duration(milliseconds: 650));
    if (!source.isAvailable(quote.draft.slot!.id)) {
      throw SlotUnavailableException();
    }
    source.book(quote.draft.slot!.id);
    final result = BookingConfirmation(
      mockAppointmentId:
          'SAX-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}',
      quote: quote,
      confirmedAt: DateTime.now(),
      nextStep: 'We’ll remind you before your appointment.',
    );
    confirmations[key] = result;
    return result;
  }
}
