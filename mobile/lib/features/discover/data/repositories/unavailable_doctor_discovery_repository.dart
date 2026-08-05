import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';
import '../../domain/repositories/doctor_discovery_repository.dart';

class UnavailableDoctorDiscoveryRepository
    implements DoctorDiscoveryRepository {
  const UnavailableDoctorDiscoveryRepository();
  Never _fail() => throw const DoctorDiscoveryFailure(
    DoctorDiscoveryFailureType.unavailable,
  );
  @override
  Future<DoctorDiscoveryOptions> loadOptions() async => _fail();
  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  }) async => _fail();
  @override
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId) async => _fail();
}
