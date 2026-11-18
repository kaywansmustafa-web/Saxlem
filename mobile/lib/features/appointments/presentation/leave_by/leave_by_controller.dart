import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../../core/location/geo_point.dart';
import '../../../../core/location/patient_locator.dart';
import '../../../../core/notifications/leave_alerts.dart';
import '../../domain/entities/departure_plan.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import 'leave_by_services.dart';

sealed class LeaveByState {
  const LeaveByState();
}

/// Not shown: no visit soon, the clinic has no map pin, or no planner.
class LeaveByHidden extends LeaveByState {
  const LeaveByHidden();
}

/// The patient hasn't turned it on (or must allow location again).
class LeaveByAsk extends LeaveByState {
  const LeaveByAsk();
}

class LeaveByWorking extends LeaveByState {
  const LeaveByWorking();
}

class LeaveByReady extends LeaveByState {
  const LeaveByReady(this.plan, {required this.approximate});
  final DeparturePlan plan;
  final bool approximate;
}

/// Location is off or refused for good: only the phone's settings can help.
class LeaveByBlocked extends LeaveByState {
  const LeaveByBlocked(this.problem);
  final LocationProblem problem;
}

class LeaveByFailed extends LeaveByState {
  const LeaveByFailed();
}

/// Works out when to leave for one visit and keeps it current while it's on
/// screen: the drive is re-checked every 5 minutes (traffic changes), and the
/// phone alert is moved to match.
class LeaveByController extends ChangeNotifier {
  LeaveByController({
    required this.appointment,
    required this.planner,
    required this.services,
    required this.alertFor,
    this.now = DateTime.now,
  });

  final PatientAppointment appointment;
  final DeparturePlanner planner;
  final LeaveByServices services;
  final LeaveAlert Function(DeparturePlan plan, DateTime at) alertFor;
  final DateTime Function() now;

  /// Only shown from a day before the visit until it starts.
  static const window = Duration(hours: 24);
  static const refreshEvery = Duration(minutes: 5);

  /// Re-used across screens so Home and the visit page agree and the
  /// routing service isn't asked twice for the same trip.
  static final _recent =
      <String, ({DeparturePlan plan, GeoPoint from, DateTime startsAt})>{};

  @visibleForTesting
  static void forgetRecent() => _recent.clear();

  LeaveByState _state = const LeaveByHidden();
  LeaveByState get state => _state;
  Timer? _refresh, _tick;
  bool _busy = false, _disposed = false;

  bool get relevant {
    final until = appointment.startsAt.difference(now());
    return appointment.canMutate && until > Duration.zero && until <= window;
  }

  Future<void> start() async {
    if (!relevant) {
      // Cancelled, moved further out, or under way: no alert should fire.
      if (!appointment.canMutate ||
          appointment.startsAt.difference(now()) > window) {
        await services.alerts.cancel(appointment.id);
      }
      return _set(const LeaveByHidden());
    }
    if (!await services.consent.given()) return _set(const LeaveByAsk());
    await refresh();
  }

  /// The patient tapped "Use my location".
  Future<void> enable() async {
    await services.consent.give();
    await services.alerts.ask();
    await refresh(ask: true);
  }

  /// The patient turned it off: forget everything and stop the alert.
  Future<void> disable() async {
    _refresh?.cancel();
    _recent.remove(appointment.id);
    await services.consent.withdraw();
    await services.alerts.cancel(appointment.id);
    _set(const LeaveByAsk());
  }

  Future<void> openSettings() async {
    if (_state case LeaveByBlocked(:final problem)) {
      await services.locator.openSettings(problem);
    }
  }

  Future<void> refresh({bool ask = false}) async {
    if (_busy || _disposed) return;
    if (!relevant) return _set(const LeaveByHidden());
    _busy = true;
    if (_state is! LeaveByReady) _set(const LeaveByWorking());
    try {
      final from = await services.locator.current(ask: ask);
      final plan = await _plan(from);
      _set(LeaveByReady(plan, approximate: from.approximate));
      await _alert(plan);
      _schedule();
    } on LocationFailure catch (failure) {
      _set(switch (failure.problem) {
        LocationProblem.denied => const LeaveByAsk(),
        LocationProblem.unavailable => const LeaveByFailed(),
        final problem => LeaveByBlocked(problem),
      });
    } on AppointmentFailure catch (failure) {
      _set(switch (failure.problem) {
        // No map pin for the clinic, or the visit changed: nothing to plan.
        AppointmentProblem.conflict ||
        AppointmentProblem.notFound ||
        AppointmentProblem.forbidden ||
        AppointmentProblem.validation => const LeaveByHidden(),
        _ => const LeaveByFailed(),
      });
    } finally {
      _busy = false;
    }
  }

  Future<DeparturePlan> _plan(GeoPoint from) async {
    final recent = _recent[appointment.id];
    if (recent != null &&
        recent.startsAt.isAtSameMomentAs(appointment.startsAt) &&
        now().difference(recent.plan.computedAt) < refreshEvery &&
        recent.from.metersTo(from) < 300) {
      return recent.plan;
    }
    final plan = await planner.departure(appointment.id, from);
    _recent[appointment.id] = (
      plan: plan,
      from: from,
      startsAt: appointment.startsAt,
    );
    return plan;
  }

  /// The alert goes out 10 minutes before it's time to leave (Android may
  /// deliver a scheduled alert a few minutes late, and it names the exact
  /// time), or at the leave time when that's closer than 10 minutes.
  Future<void> _alert(DeparturePlan plan) async {
    final soon = now().add(const Duration(minutes: 1));
    var at = plan.leaveAt.subtract(const Duration(minutes: 10));
    if (at.isBefore(soon)) at = plan.leaveAt;
    if (at.isBefore(soon)) return services.alerts.cancel(appointment.id);
    await services.alerts.schedule(alertFor(plan, at));
  }

  void _schedule() {
    _refresh?.cancel();
    _refresh = Timer(refreshEvery, refresh);
    // "Leave in 6 min" counts down by itself.
    _tick ??= Timer.periodic(const Duration(seconds: 30), (_) {
      if (!_disposed) notifyListeners();
    });
  }

  void _set(LeaveByState next) {
    if (_disposed) return;
    _state = next;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _refresh?.cancel();
    _tick?.cancel();
    super.dispose();
  }
}
