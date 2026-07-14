import 'dart:async';

import '../dto/patient_queue_snapshot_dto.dart';

sealed class MockQueueEvent {
  const MockQueueEvent();
}

class MockSnapshotEvent extends MockQueueEvent {
  const MockSnapshotEvent(this.snapshot);
  final PatientQueueSnapshotDto snapshot;
}

class MockConnectionEvent extends MockQueueEvent {
  const MockConnectionEvent(this.status);
  final String status;
}

class MockFailureEvent extends MockQueueEvent {
  const MockFailureEvent(this.message);
  final String message;
}

class MockLiveQueueDataSource {
  MockLiveQueueDataSource({
    this.updateInterval = const Duration(seconds: 8),
    this.scenario = const String.fromEnvironment(
      'LIVE_QUEUE_SCENARIO',
      defaultValue: 'live',
    ),
  });

  final Duration updateInterval;
  final String scenario;
  final _controller = StreamController<MockQueueEvent>.broadcast();
  Timer? _timer;
  int _version = 12;
  int _patientsAhead = 4;
  String _patientStatus = 'expected';
  bool _disposed = false;

  Stream<MockQueueEvent> watch(String queueEntryId) {
    if (_disposed) throw StateError('Data source has been disposed.');
    scheduleMicrotask(_emitInitialScenario);
    return _controller.stream;
  }

  Future<void> performAction(String action) async {
    if (_disposed) throw StateError('Data source has been disposed.');
    await Future<void>.delayed(const Duration(milliseconds: 550));
    _patientStatus = switch (action) {
      'onMyWay' => 'onTheWay',
      'arrived' => 'checkedIn',
      _ => _patientStatus,
    };
    _emitSnapshot();
  }

  Future<void> refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    _controller.add(const MockConnectionEvent('connected'));
    _emitSnapshot();
  }

  void _emitInitialScenario() {
    if (_disposed) return;
    switch (scenario) {
      case 'paused':
        _emitSnapshot(sessionStatus: 'paused');
      case 'reconnecting':
        _emitSnapshot();
        _controller.add(const MockConnectionEvent('reconnecting'));
      case 'stale':
        _emitSnapshot(
          updatedAt: DateTime.now().subtract(const Duration(minutes: 8)),
        );
        _controller.add(const MockConnectionEvent('stale'));
      case 'offline':
        _emitSnapshot();
        _controller.add(const MockConnectionEvent('offline'));
      case 'closed':
        _emitSnapshot(sessionStatus: 'closed');
      case 'failure':
        _controller.add(
          const MockFailureEvent('We could not load your queue.'),
        );
      default:
        _emitSnapshot();
        _timer ??= Timer.periodic(updateInterval, (_) => _progressQueue());
    }
  }

  void _progressQueue() {
    if (_patientsAhead > 0) _patientsAhead--;
    _emitSnapshot();
  }

  void _emitSnapshot({String sessionStatus = 'open', DateTime? updatedAt}) {
    if (_disposed) return;
    _version++;
    final lower = 5 + (_patientsAhead * 4);
    _controller.add(
      MockSnapshotEvent(
        PatientQueueSnapshotDto(
          sessionId: 'session-duhok-01',
          queueEntryId: 'entry-patient-23',
          queueVersion: _version,
          careProviderDisplayName: 'Dr. Ahmed Hassan',
          serviceDisplayName: 'Dentistry',
          anonymousCurrentToken: '18',
          patientNumber: '23',
          patientsAhead: _patientsAhead,
          estimatedWaitLowerMinutes: lower,
          estimatedWaitUpperMinutes: lower + 8,
          estimateConfidence: _patientsAhead <= 2 ? 'high' : 'medium',
          doctorTimingMinutes: 8,
          patientStatus: _patientStatus,
          sessionStatus: sessionStatus,
          lastUpdatedAt: (updatedAt ?? DateTime.now()).toIso8601String(),
          remoteWaitingAllowed: true,
          allowedActions: _actionsFor(sessionStatus),
        ),
      ),
    );
  }

  List<String> _actionsFor(String sessionStatus) {
    if (sessionStatus != 'open') return const ['requestHelp'];
    return switch (_patientStatus) {
      'expected' => const [
        'onMyWay',
        'arrived',
        'runningLate',
        'cancel',
        'requestHelp',
      ],
      'onTheWay' => const ['arrived', 'runningLate', 'cancel', 'requestHelp'],
      _ => const ['runningLate', 'cancel', 'requestHelp'],
    };
  }

  void dispose() {
    _disposed = true;
    _timer?.cancel();
    _controller.close();
  }
}
