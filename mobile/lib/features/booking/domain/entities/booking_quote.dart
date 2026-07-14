import 'booking_draft.dart';

class BookingQuote {
  const BookingQuote({
    required this.id,
    required this.draft,
    required this.arrivalRecommendation,
    required this.expiresAt,
  });
  final String id, arrivalRecommendation;
  final BookingDraft draft;
  final DateTime expiresAt;
}
