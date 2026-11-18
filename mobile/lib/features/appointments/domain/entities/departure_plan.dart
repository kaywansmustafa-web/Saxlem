import '../../../../core/location/geo_point.dart';

/// How the drive time was worked out, most accurate first.
enum DepartureSource {
  /// Google's road routing with live and predicted traffic.
  traffic,

  /// Road routing without traffic.
  roads,

  /// Distance only.
  estimate,

  /// Roads or distance, corrected by how long real Saxlem trips took at
  /// that hour.
  learned,
}

/// When to set off for a visit, from where the patient is now.
class DeparturePlan {
  const DeparturePlan({
    required this.leaveAt,
    required this.arriveBy,
    required this.travel,
    required this.distanceMeters,
    required this.source,
    required this.parkAndWalk,
    required this.computedAt,
  });

  final DateTime leaveAt;

  /// When to be at reception: a few minutes before the visit, to check in.
  final DateTime arriveBy;
  final Duration travel, parkAndWalk;
  final int distanceMeters;
  final DepartureSource source;
  final DateTime computedAt;

  int get travelMinutes => (travel.inSeconds / 60).ceil();
}

/// After "I'm on my way": when the clinic expects the patient.
class OnTheWay {
  const OnTheWay({
    required this.onTheWayAt,
    required this.arrivalEta,
    required this.travel,
    required this.distanceMeters,
    required this.source,
  });
  final DateTime onTheWayAt, arrivalEta;
  final Duration travel;
  final int distanceMeters;
  final DepartureSource source;
}

/// Repositories that can plan the trip to a visit.
abstract interface class DeparturePlanner {
  Future<DeparturePlan> departure(String appointmentId, GeoPoint from);

  /// Tells reception the patient has set off. Their position is used for
  /// the drive time only.
  Future<OnTheWay> onTheWay(String appointmentId, GeoPoint from);
}
