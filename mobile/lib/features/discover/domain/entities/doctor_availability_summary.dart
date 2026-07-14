import 'discovery_types.dart';

class DoctorAvailabilitySummary {
  const DoctorAvailabilitySummary({
    required this.status,
    this.earliestAvailableAt,
    this.expectedWaitMinutes,
  });
  final AvailabilityStatus status;
  final DateTime? earliestAvailableAt;
  final int? expectedWaitMinutes;
}
