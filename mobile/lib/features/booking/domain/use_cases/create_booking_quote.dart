import '../entities/booking_draft.dart';
import '../entities/booking_quote.dart';
import '../repositories/booking_repository.dart';

class CreateBookingQuote {
  const CreateBookingQuote(this.repository);
  final BookingRepository repository;
  Future<BookingQuote> call(BookingDraft draft) =>
      repository.createQuote(draft);
}
