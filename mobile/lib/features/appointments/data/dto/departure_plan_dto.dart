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
    final source = _source(json['source']);
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

  static OnTheWay parseOnTheWay(Map<String, dynamic> json) {
    const keys = {
      'onTheWayAt',
      'arrivalEta',
      'travelSeconds',
      'distanceMeters',
      'source',
    };
    final present = json.keys.toSet();
    if (present.length != keys.length || present.difference(keys).isNotEmpty) {
      throw const FormatException();
    }
    final at = _instantValue(json['onTheWayAt']);
    final eta = _instantValue(json['arrivalEta']);
    if (!eta.isAfter(at)) throw const FormatException();
    return OnTheWay(
      onTheWayAt: at,
      arrivalEta: eta,
      travel: Duration(seconds: _whole(json['travelSeconds'], 6 * 3600)),
      distanceMeters: _whole(json['distanceMeters'], 1000000),
      source: _source(json['source']),
    );
  }

  static DepartureSource _source(Object? value) => switch (value) {
    'traffic' => DepartureSource.traffic,
    'roads' => DepartureSource.roads,
    'estimate' => DepartureSource.estimate,
    'learned' => DepartureSource.learned,
    _ => throw const FormatException(),
  };

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
