import '../entities/doctor_search_criteria.dart';
import '../entities/doctor_search_page.dart';

abstract interface class DoctorDiscoveryRepository {
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    int offset = 0,
    int limit = 12,
  });
  Future<bool> toggleMyDoctor(String doctorId);
  List<String> recentSearches();
  void saveRecentSearch(String query);
}
