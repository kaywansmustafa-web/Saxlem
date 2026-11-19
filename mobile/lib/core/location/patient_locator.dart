import 'dart:async';

import 'package:geolocator/geolocator.dart';

import 'geo_point.dart';

enum LocationProblem {
  /// Location is switched off on the phone.
  serviceOff,

  /// The patient said no; the app may ask again.
  denied,

  /// The patient said no for good; only Settings can change it.
  deniedForever,

  /// The phone couldn't get a fix.
  unavailable,
}

class LocationFailure implements Exception {
  const LocationFailure(this.problem);
  final LocationProblem problem;
}

/// Where the patient is now. Read only while the app is open; never tracked.
abstract interface class PatientLocator {
  /// The current position. Shows the system permission prompt only when
  /// [ask] is true. Throws [LocationFailure].
  Future<GeoPoint> current({required bool ask});

  /// Opens the place where [problem] can be fixed.
  Future<void> openSettings(LocationProblem problem);
}

class DevicePatientLocator implements PatientLocator {
  const DevicePatientLocator();

  @override
  Future<GeoPoint> current({required bool ask}) async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw const LocationFailure(LocationProblem.serviceOff);
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied && ask) {
        permission = await Geolocator.requestPermission();
      }
      switch (permission) {
        case LocationPermission.deniedForever:
          throw const LocationFailure(LocationProblem.deniedForever);
        case LocationPermission.denied || LocationPermission.unableToDetermine:
          throw const LocationFailure(LocationProblem.denied);
        case LocationPermission.whileInUse || LocationPermission.always:
          break;
      }
      try {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 12),
          ),
        );
        return _point(position);
      } on TimeoutException {
        // Indoors or a weak signal: a fix from the last few minutes will do.
        final last = await Geolocator.getLastKnownPosition();
        if (last != null &&
            DateTime.now().difference(last.timestamp) <
                const Duration(minutes: 10)) {
          return _point(last);
        }
        throw const LocationFailure(LocationProblem.unavailable);
      }
    } on LocationFailure {
      rethrow;
    } on LocationServiceDisabledException {
      throw const LocationFailure(LocationProblem.serviceOff);
    } on PermissionDeniedException {
      throw const LocationFailure(LocationProblem.denied);
    } catch (_) {
      throw const LocationFailure(LocationProblem.unavailable);
    }
  }

  static GeoPoint _point(Position position) => GeoPoint(
    position.latitude,
    position.longitude,
    accuracyMeters: position.accuracy,
  );

  @override
  Future<void> openSettings(LocationProblem problem) async {
    try {
      problem == LocationProblem.serviceOff
          ? await Geolocator.openLocationSettings()
          : await Geolocator.openAppSettings();
    } catch (_) {
      // Nothing more the app can do; the card keeps explaining.
    }
  }
}
