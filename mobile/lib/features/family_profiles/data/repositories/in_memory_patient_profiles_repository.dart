import 'dart:async';
import '../../../../core/models/patient_profile.dart';
import '../../domain/entities/patient_profiles_snapshot.dart';
import '../../domain/repositories/patient_profiles_repository.dart';

class InMemoryPatientProfilesRepository implements PatientProfilesRepository {
  InMemoryPatientProfilesRepository({List<PatientProfile>? profiles})
    : _profiles =
          profiles ??
          [
            PatientProfile(
              id: PatientProfileId.me,
              relationship: PatientRelationship.me,
              firstName: 'Kaywan',
              lastName: 'Ahmed',
              gender: PatientGender.male,
              dateOfBirth: DateTime(1992, 4, 12),
            ),
          ];
  final List<PatientProfile> _profiles;
  PatientProfileId _active = PatientProfileId.me;
  final _changes = StreamController<PatientProfilesSnapshot>.broadcast();
  PatientProfilesSnapshot get _snapshot =>
      PatientProfilesSnapshot(profiles: _profiles, activeProfileId: _active);
  @override
  Future<PatientProfilesSnapshot> load() async => _snapshot;
  @override
  Stream<PatientProfilesSnapshot> watch() => _changes.stream;
  @override
  Future<void> add(PatientProfile profile) async {
    if (_profiles.any((p) => p.id == profile.id)) throw StateError('duplicate');
    _profiles.add(profile);
    _changes.add(_snapshot);
  }

  @override
  Future<void> select(PatientProfileId id) async {
    if (!_profiles.any((p) => p.id == id)) throw StateError('missing');
    _active = id;
    _changes.add(_snapshot);
  }

  @override
  Future<void> dispose() => _changes.close();
}
