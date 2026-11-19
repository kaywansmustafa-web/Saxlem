import '../domain/review.dart';

/// Strict readers for the review endpoints.
class ReviewDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  static ReviewPage page(Map<String, dynamic> json) {
    _keys(json, {'summary', 'items', 'nextCursor'});
    final summary = _map(json['summary']);
    _keys(summary, {'average', 'count', 'distribution'});
    final distribution = _list(
      summary['distribution'],
    ).map((value) => _int(value, 0, 10000000)).toList(growable: false);
    if (distribution.length != 5) throw const FormatException();
    final items = _list(json['items'])
        .map((raw) {
          final item = _map(raw);
          _keys(item, {'id', 'rating', 'comment', 'author', 'createdAt'});
          return PublicReview(
            id: _id(item['id']),
            rating: _int(item['rating'], 1, 5),
            comment: _nullableText(item['comment'], 2000),
            author: _nullableText(item['author'], 80),
            createdAt: _date(item['createdAt']),
          );
        })
        .toList(growable: false);
    final cursor = json['nextCursor'];
    if (cursor != null && (cursor is! String || cursor.length > 200)) {
      throw const FormatException();
    }
    return ReviewPage(
      average: _rating(summary['average']),
      count: _int(summary['count'], 0, 10000000),
      distribution: distribution,
      items: items,
      nextCursor: cursor as String?,
    );
  }

  static VisitReviewStatus status(Map<String, dynamic> json) {
    _keys(json, {'canReview', 'reviewableUntil', 'review'});
    final canReview = json['canReview'];
    if (canReview is! bool) throw const FormatException();
    return VisitReviewStatus(
      canReview: canReview,
      reviewableUntil: json['reviewableUntil'] == null
          ? null
          : _date(json['reviewableUntil']),
      review: json['review'] == null ? null : mine(_map(json['review'])),
    );
  }

  static VisitReview mine(Map<String, dynamic> json) {
    _keys(json, {
      'id',
      'rating',
      'comment',
      'anonymous',
      'status',
      'createdAt',
      'updatedAt',
    });
    final anonymous = json['anonymous'];
    if (anonymous is! bool) throw const FormatException();
    final status = json['status'];
    if (status != 'published' && status != 'hidden') {
      throw const FormatException();
    }
    _date(json['createdAt']);
    return VisitReview(
      id: _id(json['id']),
      rating: _int(json['rating'], 1, 5),
      comment: _nullableText(json['comment'], 2000),
      anonymous: anonymous,
      hidden: status == 'hidden',
      updatedAt: _date(json['updatedAt']),
    );
  }

  /// The "rating" object on a doctor.
  static DoctorRating rating(Map<String, dynamic> json) {
    _keys(json, {'average', 'count'});
    return DoctorRating(
      average: _rating(json['average']),
      count: _int(json['count'], 0, 10000000),
    );
  }

  static void _keys(Map<String, dynamic> json, Set<String> keys) {
    final present = json.keys.toSet();
    if (present.length != keys.length || present.difference(keys).isNotEmpty) {
      throw const FormatException();
    }
  }

  static Map<String, dynamic> _map(Object? value) =>
      value is Map<String, dynamic> ? value : throw const FormatException();
  static List<Object?> _list(Object? value) =>
      value is List && value.length <= 200
      ? value.cast<Object?>()
      : throw const FormatException();
  static int _int(Object? value, int min, int max) =>
      value is int && value >= min && value <= max
      ? value
      : throw const FormatException();
  static double _rating(Object? value) =>
      value is num && value >= 0 && value <= 5
      ? value.toDouble()
      : throw const FormatException();
  static String _id(Object? value) => value is String && _uuid.hasMatch(value)
      ? value
      : throw const FormatException();
  static String? _nullableText(Object? value, int max) {
    if (value == null) return null;
    if (value is! String || value.isEmpty || value.length > max) {
      throw const FormatException();
    }
    return value;
  }

  static DateTime _date(Object? value) {
    if (value is! String) throw const FormatException();
    return DateTime.tryParse(value)?.toUtc() ?? (throw const FormatException());
  }
}
