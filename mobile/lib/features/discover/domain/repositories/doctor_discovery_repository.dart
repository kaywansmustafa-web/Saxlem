import '../entities/doctor_discovery_options.dart';
import '../entities/doctor_discovery_result.dart';
import '../entities/doctor_search_criteria.dart';
import '../entities/doctor_search_page.dart';

abstract interface class DoctorDiscoveryRepository {
  Future<DoctorDiscoveryOptions> loadOptions();
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  });
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId);
}

enum DoctorDiscoveryFailureType {
  unauthenticated,
  forbidden,
  notFound,
  timeout,
  offline,
  rateLimited,
  unavailable,
  malformedResponse,
  unknown,
}

class DoctorDiscoveryFailure implements Exception {
  const DoctorDiscoveryFailure(this.type);
  final DoctorDiscoveryFailureType type;
}
