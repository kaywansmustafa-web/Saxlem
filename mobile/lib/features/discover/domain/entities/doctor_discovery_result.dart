import '../../../reviews/domain/review.dart';

class DoctorClinicReference {
  const DoctorClinicReference({required this.id, required this.name});
  final String id;
  final String name;
}

class DoctorSpecialty {
  const DoctorSpecialty({
    required this.id,
    required this.code,
    required this.displayName,
    required this.isPrimary,
  });
  final String id;
  final String code;
  final String displayName;
  final bool isPrimary;
}

enum BackendDoctorGender { female, male, unspecified }

enum BackendDoctorStatus { active, inactive }

enum DoctorAvailabilityStatus { available, unavailable }

class DoctorAvailabilityFoundation {
  const DoctorAvailabilityFoundation({
    required this.status,
    required this.acceptingNewPatients,
    required this.nextAvailableAt,
    required this.updatedAt,
  });
  final DoctorAvailabilityStatus status;
  final bool acceptingNewPatients;
  final DateTime? nextAvailableAt;
  final DateTime? updatedAt;
}

/// What a patient pays at the doctor, in IQD.
class DoctorFees {
  const DoctorFees({required this.firstVisitIqd, required this.followUpIqd});
  final int firstVisitIqd, followUpIqd;
}

class DoctorDiscoveryResult {
  const DoctorDiscoveryResult({
    required this.doctorId,
    required this.doctorDisplayName,
    required this.fullName,
    required this.primarySpecialtyDisplayName,
    required this.gender,
    required this.status,
    required this.yearsOfExperience,
    required this.languages,
    required this.clinics,
    required this.availability,
    this.photoUrl,
    this.firstName,
    this.lastName,
    this.licenseNumber,
    this.biography,
    this.specialties = const [],
    this.fees,
    this.rating,
  });

  /// Verified reviews; null for fixtures and older backends.
  final DoctorRating? rating;

  /// Null only for fixtures and older backends.
  final DoctorFees? fees;
  final String doctorId;
  final String doctorDisplayName;
  final String fullName;
  final String primarySpecialtyDisplayName;
  final BackendDoctorGender gender;
  final BackendDoctorStatus status;
  final int yearsOfExperience;
  final List<String> languages;
  final List<DoctorClinicReference> clinics;
  final DoctorAvailabilityFoundation availability;
  final String? photoUrl;
  final String? firstName;
  final String? lastName;
  final String? licenseNumber;
  final String? biography;
  final List<DoctorSpecialty> specialties;
}
