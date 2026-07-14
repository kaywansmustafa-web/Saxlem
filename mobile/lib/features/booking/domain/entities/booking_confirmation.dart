import 'booking_quote.dart';

class BookingConfirmation {
  const BookingConfirmation({
    required this.mockAppointmentId,
    required this.quote,
    required this.confirmedAt,
    required this.nextStep,
  });
  final String mockAppointmentId, nextStep;
  final BookingQuote quote;
  final DateTime confirmedAt;
}
