import '../entities/booking_confirmation.dart';
import '../entities/booking_quote.dart';
import '../repositories/booking_repository.dart';

class ConfirmBooking {
  const ConfirmBooking(this.repository);
  final BookingRepository repository;
  Future<BookingConfirmation> call(BookingQuote quote, String key) =>
      repository.confirm(quote, key);
}
