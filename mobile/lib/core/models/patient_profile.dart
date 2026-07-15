enum PatientRelationship {
  me,
  mother,
  father,
  wife,
  husband,
  son,
  daughter,
  brother,
  sister,
  grandfather,
  grandmother,
  other,
}

enum PatientGender { female, male, unspecified }

class PatientProfileId {
  const PatientProfileId(this.value) : assert(value != '');
  static const me = PatientProfileId('me');
  final String value;
  @override
  bool operator ==(Object other) =>
      other is PatientProfileId && other.value == value;
  @override
  int get hashCode => value.hashCode;
}

class PatientProfile {
  const PatientProfile({
    required this.id,
    required this.relationship,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.dateOfBirth,
  });
  final PatientProfileId id;
  final PatientRelationship relationship;
  final String firstName, lastName;
  final PatientGender gender;
  final DateTime dateOfBirth;
  String get displayName => '$firstName $lastName'.trim();
  String get initials =>
      '${firstName.isEmpty ? '' : firstName[0]}${lastName.isEmpty ? '' : lastName[0]}'
          .toUpperCase();
  int ageAt(DateTime date) {
    var age = date.year - dateOfBirth.year;
    if (date.month < dateOfBirth.month ||
        (date.month == dateOfBirth.month && date.day < dateOfBirth.day)) {
      age--;
    }
    return age;
  }
}
