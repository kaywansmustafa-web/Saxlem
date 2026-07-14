import 'discovery_location.dart';
import 'discovery_types.dart';
import 'doctor_availability_summary.dart';

class DoctorDiscoveryResult {
  const DoctorDiscoveryResult({
    required this.doctorId,
    required this.clinicId,
    required this.doctorDisplayName,
    required this.clinicDisplayName,
    required this.specialty,
    required this.subSpecialtyDisplayName,
    required this.location,
    required this.gender,
    required this.languages,
    required this.verified,
    required this.consultationFeeIqd,
    required this.patientRating,
    required this.totalRatings,
    required this.totalReviews,
    required this.availability,
    required this.recommendationScore,
    required this.isInMyDoctors,
    this.photoUrl,
  }) : assert(consultationFeeIqd >= 0),
       assert(totalRatings >= totalReviews);

  final String doctorId;
  final String clinicId;
  final String doctorDisplayName;
  final String clinicDisplayName;
  final MedicalSpecialty specialty;
  final String subSpecialtyDisplayName;
  final DiscoveryLocation location;
  final DoctorGender gender;
  final Set<SpokenLanguage> languages;
  final bool verified;
  final int consultationFeeIqd;
  final double patientRating;
  final int totalRatings;
  final int totalReviews;
  final DoctorAvailabilitySummary availability;
  final double recommendationScore;
  final bool isInMyDoctors;
  final String? photoUrl;

  DoctorDiscoveryResult copyWith({bool? isInMyDoctors}) =>
      DoctorDiscoveryResult(
        doctorId: doctorId,
        clinicId: clinicId,
        doctorDisplayName: doctorDisplayName,
        clinicDisplayName: clinicDisplayName,
        specialty: specialty,
        subSpecialtyDisplayName: subSpecialtyDisplayName,
        location: location,
        gender: gender,
        languages: languages,
        verified: verified,
        consultationFeeIqd: consultationFeeIqd,
        patientRating: patientRating,
        totalRatings: totalRatings,
        totalReviews: totalReviews,
        availability: availability,
        recommendationScore: recommendationScore,
        isInMyDoctors: isInMyDoctors ?? this.isInMyDoctors,
        photoUrl: photoUrl,
      );
}
