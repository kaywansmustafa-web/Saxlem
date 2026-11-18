import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;

/// A phone alert telling the patient it's time to set off.
class LeaveAlert {
  const LeaveAlert({
    required this.appointmentId,
    required this.profileId,
    required this.at,
    required this.title,
    required this.body,
    required this.channelName,
  });
  final String appointmentId, profileId, title, body, channelName;
  final DateTime at;
}

/// Alerts scheduled on the phone itself, so they arrive even with no
/// connection. At most one per visit.
abstract interface class LeaveAlerts {
  /// Asks for permission to show notifications (Android 13+, iOS).
  Future<void> ask();
  Future<void> schedule(LeaveAlert alert);
  Future<void> cancel(String appointmentId);

  /// Drops alerts for [profileId]'s visits that are no longer upcoming
  /// (cancelled, moved, or seen).
  Future<void> keepOnly(String profileId, Set<String> appointmentIds);
}

class DeviceLeaveAlerts implements LeaveAlerts {
  DeviceLeaveAlerts._();
  static final instance = DeviceLeaveAlerts._();

  final _plugin = FlutterLocalNotificationsPlugin();
  Future<void>? _ready;
  static const _channel = 'leave_by';
  static const _prefix = 'leave|';

  Future<void> _init() => _ready ??= _plugin
      .initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(
            requestAlertPermission: false,
            requestSoundPermission: false,
            requestBadgePermission: false,
          ),
        ),
      )
      .then((_) {});

  /// A stable notification id for a visit (FNV-1a, 31 bits).
  @visibleForTesting
  static int idFor(String appointmentId) {
    var hash = 0x811c9dc5;
    for (final unit in appointmentId.codeUnits) {
      hash = ((hash ^ unit) * 0x01000193) & 0xffffffff;
    }
    return hash & 0x7fffffff;
  }

  Future<void> _safely(Future<void> Function() action) async {
    try {
      await _init();
      await action();
    } catch (_) {
      // Alerts are a convenience; the visit's page still shows the time.
    }
  }

  @override
  Future<void> ask() => _safely(() async {
    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
    await _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, sound: true);
  });

  @override
  Future<void> schedule(LeaveAlert alert) => _safely(
    () => _plugin.zonedSchedule(
      id: idFor(alert.appointmentId),
      scheduledDate: tz.TZDateTime.from(alert.at.toUtc(), tz.UTC),
      title: alert.title,
      body: alert.body,
      payload: '$_prefix${alert.profileId}|${alert.appointmentId}',
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _channel,
          alert.channelName,
          importance: Importance.high,
          priority: Priority.high,
          category: AndroidNotificationCategory.reminder,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      // Inexact needs no special permission; Android may shift it by a few
      // minutes, so the alert goes out early and names the exact time.
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
    ),
  );

  @override
  Future<void> cancel(String appointmentId) =>
      _safely(() => _plugin.cancel(id: idFor(appointmentId)));

  @override
  Future<void> keepOnly(String profileId, Set<String> appointmentIds) =>
      _safely(() async {
        for (final pending in await _plugin.pendingNotificationRequests()) {
          final parts = (pending.payload ?? '').split('|');
          if (parts.length == 3 &&
              '${parts[0]}|' == _prefix &&
              parts[1] == profileId &&
              !appointmentIds.contains(parts[2])) {
            await _plugin.cancel(id: pending.id);
          }
        }
      });
}
