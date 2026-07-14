import '../../domain/entities/discovery_location.dart';
import '../../domain/entities/discovery_types.dart';
import '../../domain/entities/doctor_availability_summary.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../dto/doctor_discovery_result_dto.dart';

class DoctorDiscoveryResultMapper {
  const DoctorDiscoveryResultMapper();
  DoctorDiscoveryResult toDomain(
    DoctorDiscoveryResultDto dto, {
    required bool isInMyDoctors,
  }) => DoctorDiscoveryResult(
    doctorId: dto.doctorId,
    clinicId: dto.clinicId,
    doctorDisplayName: dto.doctorName,
    clinicDisplayName: dto.clinicName,
    specialty: MedicalSpecialty.values.byName(dto.specialty),
    subSpecialtyDisplayName: dto.subSpecialty,
    location: DiscoveryLocation(
      cityId: dto.cityId,
      cityDisplayName: dto.cityName,
      areaId: dto.areaId,
      areaDisplayName: dto.areaName,
      distanceMeters: dto.distanceMeters,
    ),
    gender: DoctorGender.values.byName(dto.gender),
    languages: dto.languages.map(SpokenLanguage.values.byName).toSet(),
    verified: dto.verified,
    consultationFeeIqd: dto.feeIqd,
    patientRating: dto.rating,
    totalRatings: dto.totalRatings,
    totalReviews: dto.totalReviews,
    availability: DoctorAvailabilitySummary(
      status: AvailabilityStatus.values.byName(dto.availabilityStatus),
      earliestAvailableAt: dto.earliestAvailableAt,
      expectedWaitMinutes: dto.expectedWaitMinutes,
    ),
    recommendationScore: dto.recommendationScore,
    isInMyDoctors: isInMyDoctors,
    photoUrl: dto.photoUrl,
  );
}
