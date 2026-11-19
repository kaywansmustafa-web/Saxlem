import 'dart:math' as math;

/// A place on Earth, as the phone reported it.
class GeoPoint {
  const GeoPoint(this.latitude, this.longitude, {this.accuracyMeters});
  final double latitude, longitude;

  /// How far off the phone says the position may be. Large when the patient
  /// shared only their approximate location.
  final double? accuracyMeters;

  bool get approximate => (accuracyMeters ?? 0) > 1000;

  /// Straight-line distance in metres.
  double metersTo(GeoPoint other) {
    const earth = 6371000.0;
    double rad(double degrees) => degrees * math.pi / 180;
    final dLat = rad(other.latitude - latitude);
    final dLng = rad(other.longitude - longitude);
    final a =
        math.pow(math.sin(dLat / 2), 2) +
        math.cos(rad(latitude)) *
            math.cos(rad(other.latitude)) *
            math.pow(math.sin(dLng / 2), 2);
    return 2 * earth * math.asin(math.sqrt(a));
  }
}
