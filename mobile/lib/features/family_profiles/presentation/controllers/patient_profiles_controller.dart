import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../../core/models/patient_profile.dart';
import '../../domain/entities/patient_profiles_snapshot.dart';
import '../../domain/errors/patient_profiles_failure.dart';
import '../../domain/repositories/patient_profiles_repository.dart';

enum PatientProfilesStatus {
  initial,
  loading,
  ready,
  setupRequired,
  submitting,
  selecting,
  offline,
  error,
  sessionExpired,
  malformed,
}

class PatientProfilesController extends ChangeNotifier {
  PatientProfilesController(this._repository, {required this.guest});
  final PatientProfilesRepository _repository;
  bool guest;
  PatientProfilesStatus status = PatientProfilesStatus.initial;
  PatientProfilesFailure? failure;
  void setGuest(bool value) => guest = value;
  PatientProfilesSnapshot? snapshot;
  StreamSubscription? _subscription;
  PatientProfile? get activeProfile => snapshot?.activeProfile;
  PatientProfileId get activeProfileId =>
      activeProfile?.id ?? PatientProfileId.me;
  List<PatientProfile> get profiles =>
      snapshot?.profiles
          .where((profile) => profile.active)
          .toList(growable: false) ??
      const [];
  Future<bool> load() async {
    status = PatientProfilesStatus.loading;
    failure = null;
    notifyListeners();
    try {
      _setSnapshot(await _repository.load());
      _subscription ??= _repository.watch().listen(_setSnapshot);
      return true;
    } on PatientProfilesFailure catch (error) {
      _handle(error);
      return false;
    }
  }

  Future<bool> select(PatientProfileId id) async {
    if (status == PatientProfilesStatus.selecting) return false;
    status = PatientProfilesStatus.selecting;
    failure = null;
    notifyListeners();
    try {
      _setSnapshot(await _repository.select(id));
      return true;
    } on PatientProfilesFailure catch (error) {
      _handle(error);
      return false;
    }
  }

  Future<bool> add({
    required PatientRelationship relationship,
    required String firstName,
    required String lastName,
    required PatientGender gender,
    required DateTime dateOfBirth,
  }) async {
    if (guest) throw StateError('authenticationRequired');
    if (status == PatientProfilesStatus.submitting) return false;
    status = PatientProfilesStatus.submitting;
    failure = null;
    notifyListeners();
    try {
      _setSnapshot(
        await _repository.add(
          PatientProfileDraft(
            relationship: relationship,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gender: gender,
            dateOfBirth: dateOfBirth,
          ),
        ),
      );
      return true;
    } on PatientProfilesFailure catch (error) {
      _handle(error);
      return false;
    }
  }

  void clear() {
    snapshot = null;
    failure = null;
    status = PatientProfilesStatus.initial;
    notifyListeners();
  }

  void _setSnapshot(PatientProfilesSnapshot value) {
    snapshot = value;
    failure = null;
    status = value.profiles.isEmpty
        ? PatientProfilesStatus.setupRequired
        : PatientProfilesStatus.ready;
    notifyListeners();
  }

  void _handle(PatientProfilesFailure error) {
    failure = error;
    if (error.isTerminalAuthentication) snapshot = null;
    status = switch (error.type) {
      PatientProfilesFailureType.sessionExpired ||
      PatientProfilesFailureType.unauthenticated =>
        PatientProfilesStatus.sessionExpired,
      PatientProfilesFailureType.malformed => PatientProfilesStatus.malformed,
      PatientProfilesFailureType.offline || PatientProfilesFailureType.timeout
          when snapshot != null =>
        PatientProfilesStatus.offline,
      _ => PatientProfilesStatus.error,
    };
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _repository.dispose();
    super.dispose();
  }
}
