/// A doctor's verified reviews at a glance.
class DoctorRating {
  const DoctorRating({required this.average, required this.count});
  final double average;
  final int count;
}

/// One patient's review, as other patients see it.
class PublicReview {
  const PublicReview({
    required this.id,
    required this.rating,
    required this.createdAt,
    this.comment,
    this.author,
  });
  final String id;
  final int rating;
  final String? comment;

  /// "Avin K.", or null when posted without a name.
  final String? author;
  final DateTime createdAt;
}

class ReviewPage {
  const ReviewPage({
    required this.average,
    required this.count,
    required this.distribution,
    required this.items,
    this.nextCursor,
  });
  final double average;
  final int count;

  /// How many 1-, 2-, 3-, 4- and 5-star reviews.
  final List<int> distribution;
  final List<PublicReview> items;
  final String? nextCursor;
}

/// The patient's own review of a visit.
class VisitReview {
  const VisitReview({
    required this.id,
    required this.rating,
    required this.anonymous,
    required this.hidden,
    required this.updatedAt,
    this.comment,
  });
  final String id;
  final int rating;
  final String? comment;
  final bool anonymous;

  /// Removed by Saxlem; it can't be changed.
  final bool hidden;
  final DateTime updatedAt;
}

class VisitReviewStatus {
  const VisitReviewStatus({
    required this.canReview,
    this.reviewableUntil,
    this.review,
  });
  final bool canReview;
  final DateTime? reviewableUntil;
  final VisitReview? review;
}

class ReviewFailure implements Exception {
  const ReviewFailure({this.invalidComment = false});

  /// The server refused the comment (links, emails, phone numbers).
  final bool invalidComment;
}

/// Repositories that can show a doctor's reviews.
abstract interface class DoctorReviewsSource {
  Future<ReviewPage> doctorReviews(String doctorId, {String? cursor});
}

/// Repositories that let a patient rate their own visit.
abstract interface class VisitReviewSource {
  Future<VisitReviewStatus> visitReview(String appointmentId);
  Future<VisitReview> writeReview(
    String appointmentId, {
    required int rating,
    required String? comment,
    required bool anonymous,
  });
}

/// The same rule as the server: public comments carry no links, emails or
/// phone numbers.
bool commentIsPublicSafe(String text) =>
    !RegExp(r'(https?://|www\.)', caseSensitive: false).hasMatch(text) &&
    !RegExp(r'\S+@\S+\.\S+').hasMatch(text) &&
    !RegExp(r'(\+?\d[\d\s-]{6,}\d)').hasMatch(text);
