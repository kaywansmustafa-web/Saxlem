import 'package:flutter/foundation.dart';

import '../../discover/domain/entities/doctor_discovery_result.dart';

/// Doctors a patient keeps for later. Kept per app account, so every family
/// profile on the phone sees the same list.
abstract interface class SavedDoctorsSource {
  /// Which doctors are saved; null until loaded.
  ValueListenable<Set<String>?> get savedIds;

  /// The saved doctors, newest first. Also refreshes [savedIds].
  Future<List<DoctorDiscoveryResult>> savedDoctors();

  Future<void> setSaved(String doctorId, {required bool saved});
}

class SavedDoctorsFailure implements Exception {
  const SavedDoctorsFailure();
}
