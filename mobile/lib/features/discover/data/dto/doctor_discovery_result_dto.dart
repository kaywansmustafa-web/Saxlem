class DoctorDiscoveryResultDto {
  const DoctorDiscoveryResultDto({
    required this.doctorId,
    required this.clinicId,
    required this.doctorName,
    required this.clinicName,
    required this.specialty,
    required this.subSpecialty,
    required this.cityId,
    required this.cityName,
    required this.areaId,
    required this.areaName,
    required this.distanceMeters,
    required this.gender,
    required this.languages,
    required this.verified,
    required this.feeIqd,
    required this.rating,
    required this.totalRatings,
    required this.totalReviews,
    required this.availabilityStatus,
    required this.earliestAvailableAt,
    required this.expectedWaitMinutes,
    required this.recommendationScore,
    this.photoUrl,
  });
  final String doctorId,
      clinicId,
      doctorName,
      clinicName,
      specialty,
      subSpecialty;
  final String cityId, cityName, areaId, areaName, gender, availabilityStatus;
  final int distanceMeters, feeIqd, totalRatings, totalReviews;
  final List<String> languages;
  final bool verified;
  final double rating, recommendationScore;
  final DateTime? earliestAvailableAt;
  final int? expectedWaitMinutes;
  final String? photoUrl;
}
