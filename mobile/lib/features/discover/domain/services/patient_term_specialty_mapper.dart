import '../entities/discovery_types.dart';

class PatientTermSpecialtyMapper {
  const PatientTermSpecialtyMapper();
  static const _aliases = <MedicalSpecialty, List<String>>{
    MedicalSpecialty.dermatology: ['skin problem', 'rash', 'acne'],
    MedicalSpecialty.dentistry: ['tooth pain', 'toothache', 'gum pain'],
    MedicalSpecialty.pediatrics: ['child fever', 'sick child'],
    MedicalSpecialty.ophthalmology: ['eye pain', 'blurry vision'],
    MedicalSpecialty.orthopedics: ['bone pain', 'joint pain', 'back pain'],
    MedicalSpecialty.cardiology: ['chest pain', 'heart check'],
    MedicalSpecialty.neurology: ['headache', 'nerve pain'],
    MedicalSpecialty.ent: ['ear pain', 'throat pain'],
  };

  String normalize(String input) => input
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[\u064B-\u065F]'), '')
      .replaceAll('ي', 'ی')
      .replaceAll('ك', 'ک')
      .replaceAll(RegExp(r'\s+'), ' ');

  MedicalSpecialty? specialtyFor(String query) {
    final value = normalize(query);
    for (final entry in _aliases.entries) {
      if (entry.value.any((alias) => value.contains(alias))) return entry.key;
    }
    return null;
  }
}
