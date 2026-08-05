import '../entities/doctor_search_criteria.dart';
import '../entities/doctor_search_page.dart';
import '../repositories/doctor_discovery_repository.dart';

class SearchDoctors {
  const SearchDoctors(this._repository);
  final DoctorDiscoveryRepository _repository;
  Future<DoctorSearchPage> call(
    DoctorSearchCriteria criteria, {
    int page = 1,
    int pageSize = 20,
  }) => _repository.search(criteria, page: page, pageSize: pageSize);
}
