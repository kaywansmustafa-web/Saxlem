import '../dto/doctor_discovery_result_dto.dart';

class DiscoveryOfflineException implements Exception {}

class DiscoveryFailureException implements Exception {}

class MockDoctorDiscoveryDataSource {
  MockDoctorDiscoveryDataSource({
    this.scenario = const String.fromEnvironment(
      'DOCTOR_DISCOVERY_SCENARIO',
      defaultValue: 'normal',
    ),
    this.delay = const Duration(milliseconds: 450),
  });
  final String scenario;
  final Duration delay;

  Future<List<DoctorDiscoveryResultDto>> fetch() async {
    await Future<void>.delayed(delay);
    if (scenario == 'offline') throw DiscoveryOfflineException();
    if (scenario == 'failure') throw DiscoveryFailureException();
    if (scenario == 'empty') return const [];
    final base = _records();
    if (scenario == 'large') {
      return List.generate(
        5,
        (batch) =>
            base.map((item) => _copy(item, '${item.doctorId}-$batch')).toList(),
      ).expand((e) => e).toList();
    }
    return base;
  }

  List<DoctorDiscoveryResultDto> _records() {
    final now = DateTime.now();
    const names = [
      'Dr. Dara Nivis',
      'Dr. Avin Roj',
      'Dr. Kawa Helin',
      'Dr. Lana Berfin',
      'Dr. Aras Jiyan',
      'Dr. Viyan Solav',
      'Dr. Dilan Renas',
      'Dr. Baran Loran',
      'Dr. Nalin Zerin',
      'Dr. Alan Rojdar',
      'Dr. Jinda Hivar',
      'Dr. Soran Aram',
      'Dr. Ronak Darya',
      'Dr. Rebin Nujin',
      'Dr. Shler Narin',
      'Dr. Karox Binar',
    ];
    const specialties = [
      'dentistry',
      'cardiology',
      'pediatrics',
      'ophthalmology',
      'neurology',
      'dermatology',
      'orthopedics',
      'internalMedicine',
      'gynecology',
      'ent',
    ];
    const areas = [
      ('malta', 'Malta'),
      ('masike', 'Masike'),
      ('city-center', 'City Center'),
      ('zawa', 'Zawa'),
      ('baroshke', 'Baroshke'),
      ('nizarke', 'Nizarke'),
    ];
    return List.generate(names.length, (i) {
      final status = AvailabilityStatusName.values[i % 4];
      return DoctorDiscoveryResultDto(
        doctorId: 'demo-doctor-${i + 1}',
        clinicId: 'demo-clinic-${(i % 5) + 1}',
        doctorName: names[i],
        clinicName: 'Saxlem Demo Clinic ${(i % 5) + 1}',
        specialty: specialties[i % specialties.length],
        subSpecialty: i.isEven ? 'General care' : 'Advanced consultation',
        cityId: 'duhok',
        cityName: 'Duhok',
        areaId: areas[i % areas.length].$1,
        areaName: areas[i % areas.length].$2,
        distanceMeters: 600 + (i * 430),
        gender: i.isEven ? 'female' : 'male',
        languages: i % 3 == 0
            ? const ['badiniKurdish', 'arabic', 'english']
            : const ['badiniKurdish', 'arabic'],
        verified: i % 4 != 3,
        feeIqd: 20000 + ((i % 6) * 5000),
        rating: 4.1 + ((i % 8) * 0.1),
        totalRatings: 35 + (i * 17),
        totalReviews: 12 + (i * 5),
        availabilityStatus: status.name,
        earliestAvailableAt: status == AvailabilityStatusName.fullyBooked
            ? null
            : now.add(Duration(hours: i % 8 + 1)),
        expectedWaitMinutes: status == AvailabilityStatusName.availableNow
            ? 5 + (i % 4) * 5
            : null,
        recommendationScore: 100 - i.toDouble(),
      );
    });
  }

  DoctorDiscoveryResultDto _copy(DoctorDiscoveryResultDto value, String id) =>
      DoctorDiscoveryResultDto(
        doctorId: id,
        clinicId: value.clinicId,
        doctorName: value.doctorName,
        clinicName: value.clinicName,
        specialty: value.specialty,
        subSpecialty: value.subSpecialty,
        cityId: value.cityId,
        cityName: value.cityName,
        areaId: value.areaId,
        areaName: value.areaName,
        distanceMeters: value.distanceMeters,
        gender: value.gender,
        languages: value.languages,
        verified: value.verified,
        feeIqd: value.feeIqd,
        rating: value.rating,
        totalRatings: value.totalRatings,
        totalReviews: value.totalReviews,
        availabilityStatus: value.availabilityStatus,
        earliestAvailableAt: value.earliestAvailableAt,
        expectedWaitMinutes: value.expectedWaitMinutes,
        recommendationScore: value.recommendationScore,
      );
}

enum AvailabilityStatusName {
  availableNow,
  availableToday,
  tomorrow,
  fullyBooked,
}
