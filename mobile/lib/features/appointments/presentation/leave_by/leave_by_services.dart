import '../../../../core/location/leave_by_consent.dart';
import '../../../../core/location/patient_locator.dart';
import '../../../../core/notifications/leave_alerts.dart';

/// What "when to leave" needs from the phone. Tests pass fakes.
class LeaveByServices {
  const LeaveByServices({
    required this.locator,
    required this.alerts,
    required this.consent,
  });
  final PatientLocator locator;
  final LeaveAlerts alerts;
  final LeaveByConsent consent;

  /// The real phone. Replaceable so screenshots and tests can stand in.
  static LeaveByServices device = LeaveByServices(
    locator: const DevicePatientLocator(),
    alerts: DeviceLeaveAlerts.instance,
    consent: const StoredLeaveByConsent(),
  );
}
