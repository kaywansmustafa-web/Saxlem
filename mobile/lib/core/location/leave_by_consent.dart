import 'package:shared_preferences/shared_preferences.dart';

/// Whether the patient turned on "when to leave". Until they do, the app
/// never reads their location.
abstract interface class LeaveByConsent {
  Future<bool> given();
  Future<void> give();
  Future<void> withdraw();
}

class StoredLeaveByConsent implements LeaveByConsent {
  const StoredLeaveByConsent();
  static const _key = 'saxlem.leaveBy.enabled';

  @override
  Future<bool> given() async {
    try {
      return (await SharedPreferences.getInstance()).getBool(_key) ?? false;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> give() async {
    try {
      await (await SharedPreferences.getInstance()).setBool(_key, true);
    } catch (_) {}
  }

  @override
  Future<void> withdraw() async {
    try {
      await (await SharedPreferences.getInstance()).remove(_key);
    } catch (_) {}
  }
}
