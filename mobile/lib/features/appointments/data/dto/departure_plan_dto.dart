import '../../domain/entities/departure_plan.dart';

/// Strict reader for `POST /appointments/:id/departure`.
class DeparturePlanDto {
  static final _instant = RegExp(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$',
  );
  static const _keys = {
    'leaveAt',
    'arriveBy',
    'travelSeconds',
    'distanceMeters',
    'source',
    'parkAndWalkMinutes',
    'computedAt',
  };

  static DeparturePlan parse(Map<String, dynamic> json) {
    final present = json.keys.toSet();
    if (present.length != _keys.length ||
        present.difference(_keys).isNotEmpty) {
      throw const FormatException();
    }
    final leaveAt = _instantValue(json['leaveAt']);
    final arriveBy = _instantValue(json['arriveBy']);
    final travel = _whole(json['travelSeconds'], 6 * 3600);
    final distance = _whole(json['distanceMeters'], 1000000);
    final park = _whole(json['parkAndWalkMinutes'], 60);
    final source = switch (json['source']) {
      'traffic' => DepartureSource.traffic,
      'roads' => DepartureSource.roads,
      'estimate' => DepartureSource.estimate,
      _ => throw const FormatException(),
    };
    if (!arriveBy
        .subtract(Duration(seconds: travel, minutes: park))
        .isAtSameMomentAs(leaveAt)) {
      throw const FormatException();
    }
    return DeparturePlan(
      leaveAt: leaveAt,
      arriveBy: arriveBy,
      travel: Duration(seconds: travel),
      distanceMeters: distance,
      source: source,
      parkAndWalk: Duration(minutes: park),
      computedAt: _instantValue(json['computedAt']),
    );
  }

  static DateTime _instantValue(Object? value) {
    if (value is! String || !_instant.hasMatch(value)) {
      throw const FormatException();
    }
    return DateTime.parse(value).toUtc();
  }

  static int _whole(Object? value, int maximum) {
    if (value is! int || value < 0 || value > maximum) {
      throw const FormatException();
    }
    return value;
  }
}
