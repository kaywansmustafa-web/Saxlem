import 'doctor_discovery_result.dart';

class DoctorSearchPage {
  const DoctorSearchPage({
    required this.results,
    required this.totalCount,
    required this.hasMore,
    required this.updatedAt,
    this.stale = false,
  });
  final List<DoctorDiscoveryResult> results;
  final int totalCount;
  final bool hasMore;
  final DateTime updatedAt;
  final bool stale;
}
