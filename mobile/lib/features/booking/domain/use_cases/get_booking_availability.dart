import '../entities/booking_availability.dart';
import '../repositories/booking_repository.dart';

class GetBookingAvailability {
  const GetBookingAvailability(this.repository);
  final BookingRepository repository;
  Future<BookingAvailability> call(BookingOptionsRequest request) =>
      repository.loadOptions(request);
}
