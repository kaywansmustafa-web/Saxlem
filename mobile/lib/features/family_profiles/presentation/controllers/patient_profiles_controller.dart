import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../../core/models/patient_profile.dart';
import '../../domain/entities/patient_profiles_snapshot.dart';
import '../../domain/repositories/patient_profiles_repository.dart';
import '../../domain/use_cases/patient_profile_use_cases.dart';

class PatientProfilesController extends ChangeNotifier {
  PatientProfilesController(this._repository, {required this.guest});
  final PatientProfilesRepository _repository;
  bool guest;
  void setGuest(bool value) => guest = value;
  PatientProfilesSnapshot? snapshot;
  StreamSubscription? _subscription;
  PatientProfile? get activeProfile => snapshot?.activeProfile;
  PatientProfileId get activeProfileId =>
      activeProfile?.id ?? PatientProfileId.me;
  List<PatientProfile> get profiles => snapshot?.profiles ?? const [];
  Future<void> load() async {
    snapshot = await LoadPatientProfiles(_repository)();
    _subscription ??= WatchPatientProfiles(_repository)().listen((value) {
      snapshot = value;
      notifyListeners();
    });
    notifyListeners();
  }

  Future<void> select(PatientProfileId id) =>
      SelectPatientProfile(_repository)(id);
  Future<void> add({
    required PatientRelationship relationship,
    required String firstName,
    required String lastName,
    required PatientGender gender,
    required DateTime dateOfBirth,
  }) async {
    if (guest) throw StateError('authenticationRequired');
    final id = PatientProfileId(
      'profile-${DateTime.now().microsecondsSinceEpoch}',
    );
    await AddPatientProfile(_repository)(
      PatientProfile(
        id: id,
        relationship: relationship,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender,
        dateOfBirth: dateOfBirth,
      ),
    );
    await _repository.select(id);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _repository.dispose();
    super.dispose();
  }
}
