import 'doctor_discovery_result.dart';

class DoctorSearchPage {
  const DoctorSearchPage({
    required this.results,
    required this.page,
    required this.pageSize,
    required this.totalCount,
    required this.totalPages,
  });
  final List<DoctorDiscoveryResult> results;
  final int page;
  final int pageSize;
  final int totalCount;
  final int totalPages;
  bool get hasMore => page < totalPages && results.isNotEmpty;
}
