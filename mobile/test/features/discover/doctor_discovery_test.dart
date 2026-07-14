import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/discover/data/data_sources/mock_doctor_discovery_data_source.dart';
import 'package:saxlem_app/features/discover/data/mappers/doctor_discovery_result_mapper.dart';
import 'package:saxlem_app/features/discover/data/repositories/doctor_discovery_repository_impl.dart';
import 'package:saxlem_app/features/discover/domain/entities/discovery_types.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_criteria.dart';
import 'package:saxlem_app/features/discover/domain/services/patient_term_specialty_mapper.dart';

void main() {
  late DoctorDiscoveryRepositoryImpl repository;
  setUp(
    () => repository = DoctorDiscoveryRepositoryImpl(
      MockDoctorDiscoveryDataSource(delay: Duration.zero),
      const DoctorDiscoveryResultMapper(),
      const PatientTermSpecialtyMapper(),
    ),
  );

  test('maps friendly health terms deterministically', () async {
    final page = await repository.search(
      const DoctorSearchCriteria(query: 'skin problem'),
    );
    expect(page.results, isNotEmpty);
    expect(
      page.results.every((d) => d.specialty == MedicalSpecialty.dermatology),
      isTrue,
    );
  });

  test('combines filters, sorts fees, and keeps IQD as integer', () async {
    final page = await repository.search(
      const DoctorSearchCriteria(
        verifiedOnly: true,
        availableToday: true,
        maximumFeeIqd: 45000,
        sort: DiscoverySort.lowestFee,
      ),
    );
    expect(page.results, isNotEmpty);
    expect(
      page.results.every((d) => d.verified && d.consultationFeeIqd <= 45000),
      isTrue,
    );
    expect(page.results.first.consultationFeeIqd, isA<int>());
  });

  test('favorites become persistent My Doctors membership', () async {
    final first = (await repository.search(
      const DoctorSearchCriteria(),
    )).results.first;
    expect(await repository.toggleMyDoctor(first.doctorId), isTrue);
    final refreshed = await repository.search(const DoctorSearchCriteria());
    expect(
      refreshed.results
          .firstWhere((d) => d.doctorId == first.doctorId)
          .isInMyDoctors,
      isTrue,
    );
  });
}
